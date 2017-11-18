/**
 * Created by capote on 12/08/2017.
 */
odoo.define('component.site_tree', function (require) {
    "use strict";
    var WebClient = require('web.WebClient');
    var Widget = require('web.Widget');
    var ActionManager = require('web.ActionManager');
    var Model = require('web.DataModel');
    var ControlPanel = require('web.ControlPanel');

    var widgets = require('component_explorer.widgets');


    var location_model = new Model('component.location');
    //ahora se cargan los locations
    var location_fields = ['name', 'site_id'];
    var all_sites = [];

    location_model.query(location_fields).all().then(function(locations){
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
    });

    WebClient.include({
        show_application: function() {
            this._super();
            var sites = $(".oe_secondary_menus_container");
            var sitesWidget = new widgets.SiteTreeView(sites, all_sites, this);
            sitesWidget.appendTo(sites);
        },
    });

/*
    ControlPanel.include({
        update: function (status, options) {
            this._super.apply(this, arguments);
            var mybc = "";
            for(var i=0; i<status.breadcrumbs.length;i++){
                var bc = status.breadcrumbs[i];
                mybc += ("("+bc.action + ","+bc.index + ","+bc.title + "),");
            }
            alert(mybc);
            //alert(JSON.stringify(options));
        }
    });
*/

});
