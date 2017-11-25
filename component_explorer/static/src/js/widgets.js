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

    var QWeb = core.qweb;
    var _lt = core._lt;

    var ProjectTreeView = Widget.extend({
        template: "ProjectTreeView",
        init: function (parent) {
            this._super(parent);
        },
        appendTo: function (target) {
            this._super(target);
            this.load_project_data()
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
            }
            if (deleted){
                var tree = this.$el.fancytree("getTree");
                var todelete = tree.getNodeByKey(type+"_"+site);
                todelete.remove();
            }
        },
        load_project_data: function () {
            this.project_model = new Model('component.project');
            //ahora se cargan los locations
            this.device_fields = ['id', 'name'];
            var self = this;
            this.tree = this.$el.fancytree({
                extensions: ['contextMenu'],
                contextMenu: {
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
                    if (data.node.key == 'root'){
                        self.getParent().show_project_view(id);
                        self.getParent().hide_sld_view();
                        self.getParent().hide_property_view();
                    }else{
                        var pair = data.node.key.split("_");
                        var model = "component."+pair[0];
                        var id = pair[1];
                        if (pair[0] == 'project') {
                            self.getParent().show_site_view(id);
                            self.getParent().show_property_view(model, id);
                            self.getParent().hide_sld_view();
                        } else if (pair[0] == 'site') {
                            self.getParent().show_location_view(id);
                            self.getParent().show_property_view(model, id);
                            self.getParent().show_sld_view(model, id);
                        } else if (pair[0] == 'location') {
                            self.getParent().show_location_mixed_view(id);
                            self.getParent().show_property_view(model, id);
                            self.getParent().show_sld_view(model, id);
                        } else if (pair[0] == 'sublocation') {
                            self.getParent().show_component_view(model, id);
                            self.getParent().show_property_view(model, id);
                            self.getParent().show_sld_view(model, id);
                        }
                    }
                },
            });
            var self = this;
            var projectNode = self.$el.fancytree("getRootNode");
            projectNode.addChildren({
                key: 'root',
                title: "Projects",
                folder: true
            });
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
                self.load_site_data();
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
            });
        },
        reload_content: function () {
            var root = this.$el.fancytree("getRootNode");
            root.removeChildren();
            this.load_project_data();
        },
        deactivate_lastnode: function () {
            if (this.lastActive != null){
                this.lastActive.setSelected(false);
            }
        },
        activate_node: function (type, site) {
            this.deactivate_lastnode();
            var tree = this.$el.fancytree("getTree");
            var active = tree.getNodeByKey(type+"_"+site);
            if (active != null){
                active.makeVisible();
                active.setFocus();
                this.lastActive = active;
            }
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

    var LocationView = Widget.extend({
        init: function (parent, parent_id) {
            this._super(parent);
            this.parent_id = parent_id;
            this.current_model = "component.location";
            this.dataset = new data.DataSetSearch(this, this.current_model, {
                default_site_id: parent_id,
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
        get_sublocation_domain: function () {
            return [["site_id","=",Number(this.parent_id)]];
        },
        load: function (target) {
            var self = this;
            this.target = target;
            var cexplorer = this.getParent();
            if (cexplorer['list_view']){
                cexplorer.list_view.activate_location_node(location);
                cexplorer.remove_any_previous_view(target);
            }
            this.view_model.query(['id','name','type']).filter([['name','=','Location Kanban Explorer']]).first().then(function(view) {
                self.right_panel_view = new CExplorerKanbanView(self, self.dataset, view.id, self.get_default_kanban_options("location"));
                self.right_panel_view.appendTo(self.target);
                self.right_panel_view.load_view();
                self.right_panel_view.on("view_loaded", self, function (fields_view) {
                    var context = {default_location_id: self.parent_id};
                    var domain = self.get_sublocation_domain();
                    self.right_panel_view.do_search(domain, context, []);
                })
                self.getParent().right_panel_view = self.right_panel_view;
            });
        }
    });

    var ProjectView = Widget.extend({
        init: function (parent) {
            this._super(parent);
            this.current_model = "component.project";
            this.dataset = new data.DataSetSearch(this, this.current_model, {});
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
                }
            };
        },
        load: function (target) {
            var self = this;
            this.target = target;
            var cexplorer = this.getParent();
            if (cexplorer['list_view']){
                cexplorer.list_view.activate_location_node(location);
                cexplorer.remove_any_previous_view(target);
            }
            this.view_model.query(['id','name','type']).filter([['name','=','Project Kanban Explorer']]).first().then(function(view) {
                self.right_panel_view = new CExplorerKanbanView(self, self.dataset, view.id, {});
                self.right_panel_view.appendTo(self.target);
                self.right_panel_view.load_view();
                self.right_panel_view.on("view_loaded", self, function (fields_view) {
                    self.right_panel_view.do_search([], {}, []);
                })
                self.getParent().right_panel_view = self.right_panel_view;
            });
        }
    });

    var SubLocationView = Widget.extend({
        init: function (parent, parent_id) {
            this._super(parent);
            this.parent_id = parent_id;
            this.current_model = "component.sublocation";
            this.dataset = new data.DataSetSearch(this, this.current_model, {
                default_location_id: parent_id,
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
        get_sublocation_domain: function () {
            return [["location_id","=",Number(this.parent_id)]];
        },
        load: function (target) {
            var self = this;
            this.target = target;
            var cexplorer = this.getParent();
            if (cexplorer['list_view']){
                cexplorer.list_view.activate_location_node(location);
                cexplorer.remove_any_previous_view(target);
            }
            this.view_model.query(['id','name','type']).filter([['name','=','Sublocation Kanban Explorer']]).first().then(function(view) {
                self.right_panel_view = new CExplorerKanbanView(self, self.dataset, view.id, self.get_default_kanban_options("sublocation"));
                self.right_panel_view.appendTo(self.target);
                self.right_panel_view.load_view();
                self.right_panel_view.on("view_loaded", self, function (fields_view) {
                    var context = {default_location_id: self.parent_id};
                    var domain = self.get_sublocation_domain();
                    self.right_panel_view.do_search(domain, context, []);
                })
                self.getParent().right_panel_view = self.right_panel_view;
            });
        }
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
        load: function (target) {
            var self = this;
            this.target = target;
            var cexplorer = this.getParent();
            if (cexplorer['list_view']){
                cexplorer.list_view.activate_location_node(location);
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

    return {
        ProjectTreeView: ProjectTreeView,
        CExplorerKanbanView: CExplorerKanbanView,
        ComponentsView: ComponentsView,
        LocationView: LocationView,
        ProjectView: ProjectView,
        SublocationComponentMixedView: SublocationComponentMixedView,
    };
});

