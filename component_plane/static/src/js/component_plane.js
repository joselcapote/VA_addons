/**
 * Created by capote on 13/09/2017.
 */
odoo.define('component_plane.ComponentPlaneView', function (require) {
    "use strict";

    var widgets = require('component.widgets');
    var core = require('web.core');
    var data = require('web.data');
    var View = require('web.View');
    var Model = require('web.Model');
    var QWeb = core.qweb;
    var _lt = core._lt;

    var ComponentPlaneView = View.extend({
        template: "ComponentPlaneView",
        display_name: 'Component Plane',
        icon: 'fa-calendar',
        view_type: "component_plane",
        init: function (parent, dataset, view_id, options) {
            this._super(parent);
            this.ready = $.Deferred();
            this.set_default_options(options);
            this.dataset = dataset;
            this.model = dataset.model;
            this.fields_view = {};
            this.view_id = view_id;
            this.color_map = {};
            this.title = (this.options.action) ? this.options.action.name : '';
            this.shown = $.Deferred();
            this.view_manager = parent;
            this.view_model = new Model('ir.ui.view');
            this.place_dataset = new data.DataSetSearch(this, "component.place", this.get_context());
        },
        start: function () {
            this._super();
            var list_options = {
                // records can be selected one by one
                selectable: true,
                // list rows can be deleted
                deletable: false,
                // whether the column headers should be displayed
                header: false,
                // display addition button, with that label
                addable: _lt("Create"),
                // whether the list view can be sorted, note that once a view has been
                // sorted it can not be reordered anymore
                sortable: false,
                // whether the view rows can be reordered (via vertical drag & drop)
                reorderable: false,
                action_buttons: false,
                //whether the editable property of the view has to be disabled
                disable_editable_mode: true,
                editable: 'top',
            }
            this.right_panel_parent = this.$(".o_cplane_view");
            this.$(".o_cplane_container").height = "100%";
            var self  = this;
            this.view_model.query(['id','name','type']).filter([['name','=','Place Tree View']]).first().then(function(view) {
                var tree_parent = self.$(".o_cplane_sidebar_container");
                self.list_view = new widgets.ComponentListView(self, self.place_dataset, view.id, list_options);
                self.list_view.appendTo(tree_parent);
                self.list_view.load_view();
                self.list_view.on("view_loaded", self, function (fields_view) {
                    self.list_view.groups.datagroup.group_by = ['site_id'];
                    self.list_view.reload();
                });
            });
        },
        remove_any_previous_view: function () {
        },
        /*
        * Debe mostrar un plano del sitio donde estén señalados los places que aparezcan en él.
        * el plano del sitio debe ser arquitectónico de forma que los places senalen lugares donde se ubiquen
        * pizarras o elementos que agrupen diferentes componentes.
        * */
        show_place_view: function (site) {
            var self = this;
            this.current_site = site;
            this.current_model = "component.place*";
            this.remove_any_previous_view();

            var mapElement = document.getElementsByClassName("map");
            var map = new OpenLayers.Map(mapElement);

            var options = {numZoomLevels: 3};
            var graphic = new OpenLayers.Layer.Image(
                'Site',
                'component_plane/static/images/4_m_citylights_lg.gif',
                new OpenLayers.Bounds(0, 0, 580, 288),
                new OpenLayers.Size(580, 288),
                options
            );
            map.addLayers([graphic]);
            map.zoomToMaxExtent();
            /*
            this.view_model.query(['id','name','type']).filter([['name','=','Place Kanban']]).first().then(function(view) {
                self.right_panel_view = new ComponentKanbanView(self, self.place_dataset, view.id, self.get_default_kanban_options("place"));
                self.right_panel_view.appendTo(self.right_panel_parent);
                self.right_panel_view.load_view();
                self.right_panel_view.on("view_loaded", self, function (fields_view) {
                    self.right_panel_view.do_search(self.get_site_domain(self.current_site), self.options.context, []);
                    $(".oe_delete_item").on("click", function () {

                    });
                    $(".o-kanban-button-new").parent().detach();
                    self.right_panel_view.render_buttons($(".o_cexplorer-cp-buttons"));
                    self.active_view = self.right_panel_parent;
                })
            });
*/
        },
    });

    core.view_registry.add('component_plane', ComponentPlaneView);
    return ComponentPlaneView;
});