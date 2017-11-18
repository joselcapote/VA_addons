/**
 * Created by capote on 18/08/2017.
 */
odoo.define('component_explorer.ComponentExplorerView', function (require) {
    "use strict";

    var core = require('web.core');
    var View = require('web.View');
    var Widget = require('web.Widget');
    var ListView = require('web.ListView');
    var KanbanView = require('web_kanban.KanbanView');
    var data = require('web.data');
    var Model = require('web.Model');

    var widgets = require('component_explorer.widgets');


    var ComponentExplorerView = View.extend({
        template: "ComponentExplorerView",
        display_name: 'Component Explorer',
        icon: 'fa-calendar',
        view_type: "component_explorer",
        init: function (parent, dataset, view_id, options) {
            this._super(parent);
            this.ready = $.Deferred();
            this.set_default_options(options);
            this.dataset = dataset;
            this.model = dataset.model;
            this.fields_view = {};
            this.view_id = view_id;
            this.color_map = {};
            this.title = (this.options.action)? this.options.action.name : '';
            this.shown = $.Deferred();
            this.view_manager = parent;
        },
        start: function () {
            this._super();
            this.locationsTree = new ListView(this, this.dataset, false, {editable: 'top'});
            this.locationsTree.appendTo(this.$('.o_cexplorer_sidebar_container'));
            this.component_dataset = new data.DataSet(this.parent, 'component.component');
            var self = this;
            this.view_model = new Model('ir.ui.view').query(['id','name','type']).filter([['name','=','Component Kanban']]).first().then(function(view){
                var options = {"view_id": view.id, "view_type": view.type, "context":self.context, "toolbar": false};
                self.component_view = new KanbanView(self, self.component_dataset, view.id, {});
                self.component_view.appendTo(self.$('.o_cexplorer_view'));
                self.component_view.load_view();
/*
                self.component_view.fields_view = {"fields" : fields_view};
                self.component_view.fields_keys = ["id"];
                self.component_view.group_by_field = fields_view;
*/
                self.component_view.on('view_loaded', this, function(fields_view) {
                    alert(JSON.stringify(fields_view.fields["site_id"]));
                    self.component_view.fields_view = fields_view;
                    self.component_view.group_by_field = [];
                    self.on_view();
                });
/*
                self.component_view.do_reload()
*/
            });
        },
        on_view: function () {
            this.component_view.do_search(undefined, this.get_context(), "location_id");
        }
    });

    core.view_registry.add('component_explorer', ComponentExplorerView);
    return ComponentExplorerView;
});
