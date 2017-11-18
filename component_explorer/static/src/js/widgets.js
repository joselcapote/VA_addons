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
            this.project_fields = ['id', 'name'];
            var self = this;
            this.tree = this.$el.fancytree({
                extensions: ['contextMenu'],
                contextMenu: {
                    menu: {
                        'delete': {'name': 'Delete', 'icon': 'delete', 'disabled': false},
                    },
                    actions: function (node, action) {
                        switch (action) {
                            case "delete":
                                self.delete_selected(node.key);
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
            this.project_model.query(this.project_fields).all().done(function (projects) {
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
                        folder: false,
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
                active.setSelected();
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

    return {
        ProjectTreeView: ProjectTreeView
    };
});

