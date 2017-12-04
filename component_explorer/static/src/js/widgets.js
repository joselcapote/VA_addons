/**
 * Created by capote on 25/08/2017.
 */
odoo.define('component_explorer.widgets', function (require) {
    "use strict";

    var Widget = require('web.Widget');
    var core = require('web.core');
    var Model = require('web.Model');
    var Dialog = require('web.Dialog');
    var KanbanView = require('web_kanban.KanbanView');
    var data = require('web.data');
    var ListView = require('web.ListView');
    var form_common = require('web.form_common');

    var form_relational = require('web.form_relational')

    var QWeb = core.qweb;
    var _lt = core._lt;
    var _t = core._t;

    var ProjectTreeView = Widget.extend({
        template: "ProjectTreeView",
        init: function (parent) {
            this._super(parent);
        },
        appendTo: function (target) {
            this._super(target);
            this.init_tree();
            this.load_project_data();
            this.activate_node_by_key('root');
            this.$("#tree").css("height", "100%");
            this.$(".ui-fancytree").css("height", "100%");
        },
        delete_selected: function (key) {
            var pair = key.split("_");
            var deleted = false;
            var id = Number(pair[1]);
            if (pair[0] == 'project') {
                deleted = this.getParent().delete_project(id);
            } else if (pair[0] == 'site') {
                deleted = this.getParent().delete_site(id);
            } else if (pair[0] == 'location') {
                deleted = this.getParent().delete_location(id);
            } else if (pair[0] == 'sublocation') {
                deleted = this.getParent().delete_sublocation(id);
            } else if (pair[0] == 'component') {
                deleted = this.getParent().delete_component(id);
            }
            if (deleted){
                var tree = this.$el.fancytree("getTree");
                var todelete = tree.getNodeByKey(type+"_"+site);
                todelete.remove();
            }
        },
        init_tree: function () {
            var self = this;
            this.tree = this.$el.fancytree({
                extensions: ['contextMenu'],
                contextMenu: {
                    selector: "fancytree-selector",
                    menu: function(node){
                        if (node.key == "root"){
                            return {
                                'add_project': {'name': 'Add project', 'icon': 'new', 'disabled': false},
                            };
                        }else{
                            var pair = node.key.split("_");
                            var model = pair[0];
                            if (model == "project"){
                                return {
                                    'delete': {'name': 'Delete', 'icon': 'delete', 'disabled': false},
                                    'add_site': {'name': 'Add site', 'icon': 'new', 'disabled': false},
                                    'properties': {'name': 'Properties', 'icon': 'new', 'disabled': false},
                                };
                            } else if (model == "site"){
                                return {
                                    'delete': {'name': 'Delete', 'icon': 'delete', 'disabled': false},
                                    'add_location': {'name': 'Add location', 'icon': 'new', 'disabled': false},
                                    'properties': {'name': 'Properties', 'icon': 'new', 'disabled': false},
                                };
                            } else if (model == "location"){
                                return {
                                    'delete': {'name': 'Delete', 'icon': 'delete', 'disabled': false},
                                    'add_sublocation': {'name': 'Add sublocation', 'icon': 'new', 'disabled': false},
                                    'add_device': {'name': 'Add device', 'icon': 'new', 'disabled': false},
                                    'properties': {'name': 'Properties', 'icon': 'new', 'disabled': false},
                                };
                            } else if (model == "sublocation"){
                                return {
                                    'delete': {'name': 'Delete', 'icon': 'delete', 'disabled': false},
                                    'add_device': {'name': 'Add device', 'icon': 'new', 'disabled': false},
                                    'properties': {'name': 'Properties', 'icon': 'new', 'disabled': false},
                                };
                            }
                        }
                    },
                    actions: function (node, action) {
                        var pair = node.key.split("_");
                        var model = "component."+pair[0];
                        var id = Number(pair[1]);
                        switch (action) {
                            case "delete":
                                self.delete_selected(node.key);
                                break;
                            case "add_project":
                                self.getParent().add_record("component.project", {
                                });
                                break;
                            case "add_device":
                                self.getParent().add_record("component.component", {
                                    default_parent_id: id,
                                    default_parent_model: model
                                });
                                break;
                            case "add_location":
                                self.getParent().add_record("component.location", {
                                    default_site_id: id,
                                });
                                break;
                            case "add_sublocation":
                                self.getParent().add_record("component.sublocation", {
                                    default_location_id: id,
                                });
                                break;
                            case "add_site":
                                self.getParent().add_record("component.site", {
                                    default_project_id: id
                                });
                                break;
                            case "properties":
                                self.getParent().show_properties(model, id);
                                break;
                            default:
                                alert("Unhandled clipboard action '" + action + "'");
                        }
                    }
                },
                activate: function (event, data) {
                    self.active_key = data.node.key;
                    if (data.node.key == 'root'){
                        self.getParent().show_project_view(id);
                        self.getParent().hide_sld_view();
                        self.getParent().hide_property_view();
                    }else{
                        var pair = data.node.key.split("_");
                        var model = "component."+pair[0];
                        var id = pair[1];
                        self.getParent().update_view(pair[0], id);
                    }
                },
                expand: function(event, data){
                    self.$('.fancytree-icon').addClass(function (index, currentClass) {
                        if (!('fancytree-selector' in currentClass.split(/\s+/))){
                            return 'fancytree-selector';
                        }
                    });
                    self.$('.fancytree-title').addClass(function (index, currentClass) {
                        if (!('fancytree-selector' in currentClass.split(/\s+/))){
                            return 'fancytree-selector';
                        }
                    });
                }
            });
            var self = this;
        },
        load_project_data: function () {
            var self = this;
            var projectNode = self.$el.fancytree("getRootNode");
            projectNode.addChildren({
                key: 'root',
                title: "Projects",
                folder: true
            });
            this.project_model = new Model('component.project');
            //ahora se cargan los locations
            this.device_fields = ['id', 'name'];
            var rootNode = self.$el.fancytree("getTree").getNodeByKey('root');
            this.project_model.query(this.device_fields).all().done(function (projects) {
                for (var i = 0; i < projects.length; i++) {
                    var project = projects[i];
                    rootNode.addChildren({
                        key: 'project_' + project.id,
                        title: project.name,
                        tooltip: project.abstract,
                        folder: true
                    });
                }
                rootNode.toggleExpanded();
                self.activate_node_by_key(self.active_key);
                self.load_site_data();
            });
            self.$('.fancytree-icon').addClass(function (index, currentClass) {
                if (!('fancytree-selector' in currentClass.split(/\s+/))){
                    return 'fancytree-selector';
                }
            });
            self.$('.fancytree-title').addClass(function (index, currentClass) {
                if (!('fancytree-selector' in currentClass.split(/\s+/))){
                    return 'fancytree-selector';
                }
            });
        },
        load_site_data: function () {
            this.site_model = new Model('component.site');
            //ahora se cargan los locations
            this.site_fields = ['id', 'name', 'project_id'];
            var self = this;
            this.site_model.query(this.site_fields).all().done(function (sites) {
                for (var i = 0; i < sites.length; i++) {
                    var site = sites[i];
                    var tree = self.$el.fancytree("getTree");
                    var projectNode = tree.getNodeByKey('project_' + site.project_id[0]);
                    var siteNode = projectNode.addChildren({
                        key: 'site_' + site.id,
                        title: site.name,
                        folder: true,
                    });
                }
                self.activate_node_by_key(self.active_key);
                self.load_location_data();
            });
        },
        load_location_data: function () {
            this.location_model = new Model('component.location');
            //ahora se cargan los locations
            this.location_fields = ['id', 'name', 'site_id'];
            var self = this;
            this.location_model.query(this.location_fields).all().done(function (locations) {
                for (var i = 0; i < locations.length; i++) {
                    var location = locations[i];
                    var tree = self.$el.fancytree("getTree");
                    var siteNode = tree.getNodeByKey('site_' + location.site_id[0]);
                    var siteNode = siteNode.addChildren({
                        key: 'location_' + location.id,
                        title: location.name,
                        folder: true,
                    });
                }
                self.activate_node_by_key(self.active_key);
                self.load_sublocation_data();
            });
        },
        load_sublocation_data: function () {
            this.sublocation_model = new Model('component.sublocation');
            //ahora se cargan los locations
            this.sublocation_fields = ['id', 'name', 'location_id'];
            var self = this;
            this.sublocation_model.query(this.sublocation_fields).all().done(function (sublocations) {
                for (var i = 0; i < sublocations.length; i++) {
                    var sublocation = sublocations[i];
                    var tree = self.$el.fancytree("getTree");
                    var locationNode = tree.getNodeByKey('location_' + sublocation.location_id[0]);
                    var siteNode = locationNode.addChildren({
                        key: 'sublocation_' + sublocation.id,
                        title: sublocation.name,
                        folder: true,
                    });
                }
                self.activate_node_by_key(self.active_key);
            });
        },
        reload_content: function () {
            var root = this.$el.fancytree("getRootNode");
            root.removeChildren();
            var self = this;
            $.when(this.load_project_data()).done(function () {
                if (self.active_key){
                    self.activate_node_by_key(self.active_key);
                }
            })
        },
        activate_node: function (type, site) {
            var tree = this.$el.fancytree("getTree");
            tree.activateKey(type+"_"+site);
        },
        activate_node_by_key: function (key) {
            var tree = this.$el.fancytree("getTree");
            if (tree.getNodeByKey(key)){
                tree.activateKey(key);
            }
        },
        activate_node_by_model: function (model, id) {
            var type = model.split('\.')[1];
            this.activate_node(type, id);
        },
        activate_site_node: function (site) {
            this.activate_node("site", site);
        },
        activate_location_node: function (location) {
            this.activate_node("location", location);
        },
        activate_project_node: function (project) {
            this.activate_node("project", project);
        }
    });

    var CExplorerKanbanView = KanbanView.extend({
        init: function (parent, dataset, view_id, options) {
            this._super(parent, dataset, view_id, options);
            this.cexplorer_view = parent;
        },
        //El metodo load_record del KanbanView original no permite cargar un filtro determinado para limitar los objetos.
        //estamos redefiniendo el método para poder filtrar los objetos
        load_records: function (offset, dataset) {
            var options = {
                'limit': this.limit,
                'offset': offset,
            };
            if (this.get_domain() != undefined){
                options['domain'] = this.get_domain();
            }
            dataset = dataset || this.dataset;
            return dataset
                .read_slice(this.fields_keys.concat(['__last_update']), options)
                .then(function(records) {
                    return {
                        records: records,
                        is_empty: !records.length,
                        grouped: false,
                    };
                });
        },
        set_domain: function (domain) {
            this._domain = domain;
        },
        get_domain: function () {
            return this._domain;
        },
        do_search: function(domain, context, group_by) {
            this.set_domain(domain);
            return this._super(domain, context, group_by);
        },
        add_record: function() {
            this.cexplorer_view.add_record();
        },
        get_treeview: function () {
            var parent = this.getParent();
            if (parent['get_treeview']){
                var tree = this.getParent().get_treeview();
            }
            if (!tree){
                var parent = this.getParent().getParent();
                if (parent['get_treeview']){
                    var tree = parent.get_treeview();
                }
            }
            return tree;
        },
        show_component_view: function (model, id) {
            this.parent.show_component_view(model, id);
        },
        remove_record: function (id) {
            var self = this;
            function do_it() {
                return $.when(self.dataset.unlink([id])).done(function() {
                    Dialog.alert(this, _t("Changes where done."));
                    return true;
                });
            }
            if (this.options.confirm_on_delete) {
                Dialog.confirm(this, _t("Are you sure you want to delete this record ?"), { confirm_callback: do_it });
            } else {
                do_it();
            }
        }
    });

    var BaseKanbanView  = Widget.extend({
        init: function (parent, parent_model, parent_id) {
            this._super(parent);
            this.parent_id = parent_id;
            this.current_model = parent_model;
            this.dataset = new data.DataSetSearch(this, this.current_model, null);
            this.view_model = new Model('ir.ui.view');
        },
        get_treeview : function () {
            return this.getParent().get_treeview();
        },
        appendTo: function (target) {
            this._super(target);
            this.load(target)
        },
        get_context: function () {
            return {
            }
        },
        get_default_kanban_options: function () {
            return {
                // records can be selected one by one
                selectable: true,
                // list rows can be deleted
                deletable: false,
                // whether the column headers should be displayed
                header: true,
                // display addition button, with that label
                addable: _lt("Create"),
                // whether the list view can be sorted, note that once a view has been
                // sorted it can not be reordered anymore
                sortable: false,
                // whether the view rows can be reordered (via vertical drag & drop)
                reorderable: false,
                action_buttons: true,
                //whether the editable property of the view has to be disabled
                disable_editable_mode: false,
                editable: 'top',
                creatable: true,
                context: this.get_context()
            };
        },
        get_domain: function () {
            return [[]];
        },
        load: function (target) {
            var self = this;
            this.target = target;
            var cexplorer = this.getParent();
            if (cexplorer['list_view']){
                cexplorer.remove_any_previous_view(target);
            }
            this.view_model.query(['id','name','type']).filter([['name','=',this.get_view_name()]]).first().then(function(view) {
                self.right_panel_view = new CExplorerKanbanView(self, self.dataset, view.id, self.get_default_kanban_options());
                self.right_panel_view.appendTo(self.target);
                self.right_panel_view.load_view();
                self.right_panel_view.on("view_loaded", self, function (fields_view) {
                    var context = self.get_context();
                    var domain = self.get_domain();
                    //alert(JSON.stringify(context)+'\n'+JSON.stringify(domain));
                    self.right_panel_view.do_search(domain, context, []);
                })
                self.getParent().right_panel_view = self.right_panel_view;
            });
        }
    });

    var LocationView = BaseKanbanView.extend({
        init: function (parent, parent_id) {
            this._super(parent, 'component.location', parent_id);
        },
        get_view_name: function () {
            return 'Location Kanban Explorer';
        },
        get_domain: function () {
            return [["site_id","=",Number(this.parent_id)]];
        },
        get_context: function () {
            return {
                default_site_id: this.parent_id,
            }
        },
    });

    var ProjectView = BaseKanbanView.extend({
        init: function (parent, parent_id) {
            this._super(parent, 'component.project', -1);
        },
        get_view_name: function () {
            return 'Project Kanban Explorer';
        },
        get_domain: function () {
            return [];
        },
        get_context: function () {
            return {

            }
        },
    });

    var SiteView = BaseKanbanView.extend({
        init: function (parent, parent_id) {
            this._super(parent, 'component.site', parent_id);
        },
        get_view_name: function () {
            return 'Site Kanban Explorer';
        },
        get_domain: function () {
            return [["project_id","=",Number(this.parent_id)]];
        },
        get_context: function () {
            return {
                default_project_id: this.parent_id,
            }
        },
    });

    var SubLocationView = BaseKanbanView.extend({
        init: function (parent, parent_id) {
            this._super(parent, 'component.sublocation', parent_id);
        },
        get_view_name: function () {
            return 'Sublocation Kanban Explorer';
        },
        get_domain: function () {
            return [["location_id","=",Number(this.parent_id)]];
        },
        get_context: function () {
            return {
                default_location_id: this.parent_id,
            }
        },
    });

    var ComponentsView = Widget.extend({
        init: function (parent, parent_id, parent_model) {
            this._super(parent);
            this.parent_id = parent_id;
            this.parent_model = parent_model;
            this.current_model = "component.component";
            this.dataset = new data.DataSetSearch(this, "component.component", {
                default_parent_id: parent_id,
                default_parent_model: parent_model
            });
            this.view_model = new Model('ir.ui.view');
        },
        appendTo: function (target) {
            this._super(target);
            this.load(target)
        },
        get_default_kanban_options: function (concept) {
            return {
                // records can be selected one by one
                selectable: true,
                // list rows can be deleted
                deletable: false,
                // whether the column headers should be displayed
                header: true,
                // display addition button, with that label
                addable: _lt("Create "+concept),
                // whether the list view can be sorted, note that once a view has been
                // sorted it can not be reordered anymore
                sortable: false,
                // whether the view rows can be reordered (via vertical drag & drop)
                reorderable: false,
                action_buttons: true,
                //whether the editable property of the view has to be disabled
                disable_editable_mode: false,
                editable: 'top',
                creatable: true,
                context: {
                    default_location_id: this.current_location,
                    default_site_id: this.current_site,
                }
            };
        },
        get_component_domain: function () {
            return [["parent_id","=",Number(this.parent_id)], ["parent_model","=",this.parent_model]];
        },
        on_delete_record: function (e) {
            alert();
        },
        load: function (target) {
            var self = this;
            this.target = target;
            var cexplorer = this.getParent();
            if (cexplorer['list_view']){
                cexplorer.remove_any_previous_view(target);
            }
            this.view_model.query(['id','name','type']).filter([['name','=','Component Kanban']]).first().then(function(view) {
                self.right_panel_view = new CExplorerKanbanView(self, self.dataset, view.id, self.get_default_kanban_options("component"));
                self.right_panel_view.appendTo(self.target);
                self.right_panel_view.load_view();
                self.right_panel_view.on("view_loaded", self, function (fields_view) {
                    var context = {default_parent_id: self.parent_id, default_parent_model: self.parent_model};
                    var domain = self.get_component_domain();
                    self.right_panel_view.do_search(domain, context, []);
                    //self.$el.on('click','a[data-id]',self.on_delete_record);
/*
                    $('<span>')
                        .addClass('fa fa-trash-o')
                        .click(function (event) {
                            alert(delete)
                        })
                        .appendTo($delete_action);
*/
                })
                self.getParent().right_panel_view = self.right_panel_view;
            });
        }
    });

    var SublocationComponentMixedView = Widget.extend({
        template: "SublocationComponentMixedView",
        init: function (parent, parent_id) {
            this._super(parent);
            this.parent_id = parent_id;
            this.parent_model = "component.location";
            this.node_name = this.parent_model.split(".")[1]+"_"+parent_id;
            this.view_model = new Model('ir.ui.view');
        },
        get_treeview: function () {
            return this.getParent().list_view;
        },
        appendTo: function (target) {
            this._super(target);
            this.load()
        },
        get_default_kanban_options: function (concept) {
            return {
                // records can be selected one by one
                selectable: true,
                // list rows can be deleted
                deletable: false,
                // whether the column headers should be displayed
                header: true,
                // display addition button, with that label
                addable: _lt("Create "+concept),
                // whether the list view can be sorted, note that once a view has been
                // sorted it can not be reordered anymore
                sortable: false,
                // whether the view rows can be reordered (via vertical drag & drop)
                reorderable: false,
                action_buttons: true,
                //whether the editable property of the view has to be disabled
                disable_editable_mode: false,
                editable: 'top',
                creatable: true,
                context: {
                    default_location_id: this.parent_id,
                }
            };
        },
        show_location_view: function () {
            var sublocation_view = new SubLocationView(this, this.parent_id);
            sublocation_view.appendTo(this.$("#sublocations"));
        },
        show_component_view: function () {
            var component_view = new ComponentsView(this, this.parent_id, this.parent_model);
            component_view.appendTo(this.$("#devices"));
        },
        load: function () {
            this.show_location_view();
            this.show_component_view();
        },
    });

    core.form_widget_registry.get('one2many').include({
        init: function () {
            this._super.apply(this, arguments);
            this.x2many_views.list.include({
                select_component_model: function (do_it) {
                    var component_types = [];
                    component_types.push({title: "LV AC Cable", model: "component.lv_ac_cable"});
                    component_types.push({title: 'SWR', model: "component.swr_component"});
                    component_types.push({title: 'Dry Transformer', model: "component.dry_transformer"});
                    component_types.push({title: 'LV Circuit breaker', model: "'component.lv_cb_component"});
                    var buttons = [
                        {
                            text: _t("Ok"),
                            classes: 'btn-primary',
                            close: true,
                            click: do_it
                        },
                        {
                            text: _t("Cancel"),
                            close: true,
                            click: options && options.cancel_callback
                        }
                    ];
                    var options = {
                        size: 'medium',
                        buttons: buttons,
                        title: _t("Select component type"),
                        $content: QWeb.render('ComponentTypeSelectDialog', {component_types: component_types}),
                    };
                    var dialog = new Dialog(this, options).open();
                    var self = this;
                    dialog.$el.find('input').click(function() {
                        var value = $(this).attr('value');
                        self.selected_component_model = value;
                    });
                    return dialog;
                },
                do_switch_view: function(model, context){
                    var self = this;
                    this.view_model = new Model('ir.ui.view');
                    this.view_model.query(['id','name','type']).filter([['model','=',model], ['type','=','form']]).first().then(function(view) {
                        self.createdialog = new form_common.SelectCreateDialog(this, {
                            res_model: model,
                            domain: self.x2m.build_domain(),
                            context: context,
                            title: _t("Create: ") + self.x2m.string,
                            initial_view: "form",
                            disable_multiple_selection: true,
                            alternative_form_view: self.x2m.field.views ? self.x2m.field.views.form : undefined,
                            create_function: function(withdata, options) {
                                withdata['component_model']=model;
                                return self.x2m.data_create(withdata, options);
                            },
                                /*
                            write_function: function(id, withdata, options, sup) {
                                alert("write_function");

                                                                alert(JSON.stringify(withdata));
                                                                var dataset = new data.DataSet(self.x2m, model, self.x2m.build_context());
                                                                dataset.create(withdata, self.x2m.internal_options).then(function (id) {
                                                                    alert(JSON.stringify(fields_view.fields));
                                */
/*
                                    dataset.read_ids([id], view).then(function (records) {
                                        alert(JSON.stringify(records));
                                        self.trigger('write_completed saved', r[0]);
                                    });
                                });
                            },
 */
                            read_function: function(ids, fields, options) {
                                return self.x2m.data_read(ids, fields, options);
                            },
                            parent_view: self.x2m.view,
                            child_name: self.x2m.name,
                            form_view_options: {'not_interactible_on_create':true},
                            on_selected: function() {
                                self.x2m.reload_current_view();
                            }
                        }).open();
/*
                        self.prev_form_dialog = new form_common.FormViewDialog(self, {
                            res_model: model,
                            context: context,
                            title: "New..",
                            view_id: view.id,
                            res_id: null,
                            readonly: false,
                            buttons: [
                                {text: _t("Save"), classes: 'btn-primary', close: true, click: function() {
                                    $.when(self.prev_form_dialog.view_form.save()).done(function() {
                                        self.prev_form_dialog.close();
                                        self.reload_content();
                                    });
                                }},
                                {text: _t("Close"), close: true}
                            ]
                        }).open();
*/
                    });
                },
                do_add_record: function () {
                    if (this.dataset.model == 'component.component') {
                        this.$('table:first').show();
                        this.$('.oe_view_nocontent').remove();
                        var self = this;
                        this.select_component_model(function (dialog) {
                            var context= self.x2m.build_context();
                            self.do_switch_view(self.selected_component_model, context);
                        });
                    } else {
                        this._super.apply(this, arguments);
                    }
                },
            });
        },
    });

    ListView.List.include({
        do_switch_view: function(model, context){
            var self = this;
            this.view_model = new Model('ir.ui.view');
            this.view_model.query(['id','name','type']).filter([['model','=',model], ['type','=','form']]).first().then(function(view) {
                if (self.prev_form_dialog){
                    self.prev_form_dialog.destroy();
                }
                context.view_id= view.id;
                //alert(JSON.stringify(context));
                self.prev_form_dialog = new form_common.FormViewDialog(self, context).open();
            });
        },
        row_clicked: function (event, view) {
            if (this.view.model == 'component.component'){
                var model = new Model('component.component', {});
                var parent_id = this.dataset.ids[this.dataset.index];
                var self = this;
                model.call("open_component_view", [parent_id]).then(function(action){
                    self.prev_form_dialog = new form_common.FormViewDialog(self, action).open();
                });
            }else{
                $(this).trigger(
                    'row_link',
                    [this.dataset.ids[this.dataset.index],
                        this.dataset, view]);
            }
        },
    });

    return {
        ProjectTreeView: ProjectTreeView,
        CExplorerKanbanView: CExplorerKanbanView,
        ComponentsView: ComponentsView,
        LocationView: LocationView,
        ProjectView: ProjectView,
        SiteView: SiteView,
        SublocationComponentMixedView: SublocationComponentMixedView,
    };
});

