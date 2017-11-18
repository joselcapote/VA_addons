/**
 * Created by capote on 25/08/2017.
 */
odoo.define('component_explorer.widgets', function(require) {
    "use strict";

    var Widget = require('web.Widget');
    var core = require('web.core');
    var Model = require('web.Model');
    var QWeb = core.qweb;

    var ActionEnabledWidget = Widget.extend({
        init: function (parent, web_client) {
            this.web_client = web_client;
            this.action_manager = web_client.action_manager;
        },
        fire_action: function (action) {
            this.action_manager.do_action(action, {clear_breadcrumbs: true});
        }
    });

    var PlaceWidget = ActionEnabledWidget.extend({
        init: function (parent, location, web_client) {
            this._super(parent, web_client);
            this.location = location;
        },
        start: function () {
            var location_rendered = QWeb.render("PlaceWidget", {location: this.location});
            $(location_rendered).appendTo(this.$el);
        },
        fire_action: function (action) {
            this._super(action);
        },
        bind_events: function () {
            var self = this;
            $(".location_"+this.location.id).click(function () {
                self.fire_action({
                    name: self.location.name,
                    res_model: "component.component",
                    domain: [['location_id', 'in', [self.location.id]]],
                    type: 'ir.actions.act_window',
                    views: [[false, 'kanban'],[false, 'form']],
                    view_type: "form",
                    view_mode: "kanban,tree,form",
                    context: {
                        default_location_id: self.location.id,
                        default_site_id: self.location.site_id[0],
                    }
                });
                /*
                 new Model("component.component").call('get_formview_id', ["components_kanban_view"]).then(function (view_id) {
                 });
                 */
            })
        },
    });

    var SiteWidget = ActionEnabledWidget.extend({
        init: function (parent, site, web_client) {
            this.template = "SiteWidget";
            this._super(parent, web_client);
            this.site = site;
            this.web_client = web_client;
            this.ul = null;
            this.location_widgets = [];
        },
        start: function () {
/*
            var site_rendered = QWeb.render("SiteWidget", {site: this.site});
            this.$(site_rendered).appendTo(this.$el);
*/
            this.ul = this.$(".ce_site_locations");
            for(var i = 0; i<this.site.locations.length; i++){
                var locationWidget = new PlaceWidget(this.ul, this.site.locations[i], this.web_client);
                locationWidget.appendTo($(this.ul));
                this.location_widgets.push(locationWidget);
            }
        },
        bind_events: function () {
            var self = this;
            $(".site_"+this.site.id).on("click", function () {
                $(".site_"+self.site.id+"_locations").toggle();
                self.fire_action({
                    name: self.site.name,
                    res_model: "component.location",
                    domain: [['site_id', 'in', [self.site.id]]],
                    type: 'ir.actions.act_window',
                    views: [[false, 'kanban'],[false, 'form']],
                    view_type: "form",
                    view_mode: "kanban,tree,form",
                    context: {
                        default_site_id: self.site.id,
                    }
                });
            })
            for(var i = 0; i<this.location_widgets.length; i++){
                this.location_widgets[i].bind_events();
            }
        },
        appendTo: function (target) {
            this._super(target);
            this.bind_events();
        }
    });

    var SiteTreeView = Widget.extend({
        init: function (parent, web_client) {
            this.template = "SiteTreeView";
            this._super(parent);
            this.web_client = web_client;
            this.sitesWidgets = [];
            this.location_model = new Model('component.location');
            //ahora se cargan los locations
            this.location_fields = ['name', 'site_id'];
        },
        load_site_data: function () {
            var self = this;
            this.location_model.query(this.location_fields).all().then(function(locations){
                var all_sites = [];
                var site_by_id = {};
                for (var i = 0; i < locations.length; i++) {
                    var site_id = locations[i].site_id[0];
                    var site_name = locations[i].site_id[1];
                    var site = site_by_id[site_id];
                    if (site == undefined){
                        site = {id: site_id, name: site_name, locations: []};
                        site_by_id[site_id] = site;
                    }
                    site.locations.push(locations[i]);
                }
                var i = 1;
                while(site_by_id[i] != undefined){
                    all_sites.push(site_by_id[i]);
                    i++;
                }
                self.update_ui(all_sites, self);
            });
        },
        start: function () {
            this.load_site_data();
        },
        update_ui: function (sites, self) {
            if (sites.length > 0){
                for(var i = 0; i<sites.length; i++){
                    var siteWidget = new SiteWidget(self.$(".oe_treedata"), sites[i], this.web_client);
                    siteWidget.appendTo(self.$(".oe_treedata"));
                    self.sitesWidgets.push(siteWidget);
                }
            }
            self.$("#tree").fancytree();
            self.do_show();
        },
    });
    return {
        SiteTreeView: SiteTreeView,
        SiteWidget: SiteWidget,
        PlaceWidget: PlaceWidget
    };
});

