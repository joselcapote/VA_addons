/**
 * Created by capote on 25/08/2017.
 */
odoo.define('component_explorer.widgets', function (require) {
    "use strict";

    var Widget = require('web.Widget');
    var core = require('web.core');
    var Model = require('web.Model');
    var QWeb = core.qweb;

    var ProjectTreeView = Widget.extend({
        template: "ProjectTreeView",
        init: function (parent) {
            this._super(parent);
        },
        appendTo: function (target) {
            this._super(target);
            this.load_project_data()
        },
        delete_selected: function (key) {
            var pair = key.split("_");
            var deleted = false;
            if (pair[0] == 'project') {
                deleted = this.getParent().delete_project(pair[1]);
            } else if (pair[0] == 'site') {
                deleted = this.getParent().delete_site(pair[1]);
            } else if (pair[0] == 'location') {
                deleted = this.getParent().delete_location(pair[1]);
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

/*
            $("#tree").contextmenu({
                delegate: "span.fancytree-title",
//			menu: "#options",
                menu: [
                    {title: "Cut", cmd: "cut", uiIcon: "ui-icon-scissors"},
                    {title: "Copy", cmd: "copy", uiIcon: "ui-icon-copy"},
                    {title: "Paste", cmd: "paste", uiIcon: "ui-icon-clipboard", disabled: false },
                    {title: "----"},
                    {title: "Edit", cmd: "edit", uiIcon: "ui-icon-pencil", disabled: true },
                    {title: "Delete", cmd: "delete", uiIcon: "ui-icon-trash", disabled: true },
                    {title: "More", children: [
                        {title: "Sub 1", cmd: "sub1"},
                        {title: "Sub 2", cmd: "sub1"}
                    ]}
                ],
                beforeOpen: function(event, ui) {
                    var node = $.ui.fancytree.getNode(ui.target);
//                node.setFocus();
                    node.setActive();
                },
                select: function(event, ui) {
                    var node = $.ui.fancytree.getNode(ui.target);
                    alert("select " + ui.cmd + " on " + node);
                }
            });
*/

            this.tree = this.$el.fancytree({
                extensions: ['contextMenu'],
                contextMenu: {
                    menu: {
                        'delete': {'name': 'Delete', 'icon': 'delete', 'disabled': false},
                        'add_project': {'name': 'Add project', 'icon': 'new', 'disabled': false},
                        'add_site': {'name': 'Add site', 'icon': 'new', 'disabled': false},
                        'add_location': {'name': 'Add location', 'icon': 'new', 'disabled': false},
                        'add_sublocation': {'name': 'Add sublocation', 'icon': 'new', 'disabled': false},
                        'add_device': {'name': 'Add device', 'icon': 'new', 'disabled': false},
                        'properties': {'name': 'Properties', 'icon': 'new', 'disabled': false},
                    },
                    beforeOpen: function(event, data){
                        alert(data.node.key);
                    },
                    actions: function (node, action) {
                        var pair = node.key.split("_");
                        var model = "component."+pair[0];
                        var id = pair[1];
                        switch (action) {
                            case "delete":
                                self.delete_selected(node.key);
                                break;
                            case "add_project":
                                self.getParent().add_project();
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
                    var pair = data.node.key.split("_");
                    var model = "component."+pair[0];
                    var id = pair[1];
                    if (pair[0] == 'project') {
                        self.getParent().show_site_view(id);
                        self.getParent().show_property_view(model, id)
                    } else if (pair[0] == 'site') {
                        self.getParent().show_location_view(id);
                        self.getParent().show_property_view(model, id)
                        self.getParent().show_sld_view(model, id)
                    } else if (pair[0] == 'location') {
                        self.getParent().show_component_view(id);
                        self.getParent().show_property_view(model, id)
                        self.getParent().show_sld_view(model, id)
                    } else if (pair[0] == 'sublocation') {
                        self.getParent().show_component_view(id);
                        self.getParent().show_property_view(model, id)
                        self.getParent().show_sld_view(model, id)
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
        show_component_view: function (location) {
            this.parent.show_component_view(location);
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

    var ComponentsView = Widget.extend({
        init: function (parent, location, where) {
            this._super(parent);
            this.location = location;
            this.current_model = "component.component";
            this.where = where;
        },
        appendTo: function (target) {
            this._super(target);
            this.load()
        },
        load: function () {
            var self = this;
            parent.list_view.activate_location_node(location);
            parent.remove_any_previous_view(parent.right_panel_parent);
            var component_view_parent = self.right_panel_parent;
            if (this.where){
                component_view_parent = this.where;
            }
            this.view_model.query(['id','name','type']).filter([['name','=','Component Kanban']]).first().then(function(view) {
                //var options = {"view_id": view.id, "view_type": view.type, "context": self.context, "toolbar": false};
                self.right_panel_view = new CExplorerKanbanView(self, self.dataset, view.id, self.get_default_kanban_options("component"));
                self.right_panel_view.appendTo(component_view_parent);
                self.right_panel_view.load_view();
                self.right_panel_view.on("view_loaded", self, function (fields_view) {
                    var context = {"default_site_id": self.current_site, "default_location_id": self.current_location};
                    var location_domin = self.get_location_domain(self.current_location, self.current_query);
                    //alert(JSON.stringify(location_domin)+"\nlocation:"+self.current_location+"\nquery:"+self.current_query);
                    self.right_panel_view.do_search(location_domin, context, []);
                    $(".o-kanban-button-new").parent().detach();
                    /*
                     self.right_panel_view.render_buttons($(".o_cexplorer-cp-buttons"));
                     */
                })
            });
        }
    });

    var SublocationComponentMixedView = Widget.extend({
        init: function (parent) {
            this._super(parent);
        },
        appendTo: function (target) {
            this._super(target);
            this.load()
        },
        load: function () {

        },
        show_component_view: function (location, where) {
        }
    });

    return {
        ProjectTreeView: ProjectTreeView
    };
});

