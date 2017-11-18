odoo.define('component.widgets', function(require) {
    "use strict";

    var ListView = require('web.ListView');
    var Widget = require('web.Widget');
    var core = require('web.core');
    var Model = require('web.Model');
    var QWeb = core.qweb;

    var ComponentListView = ListView.extend({
        init: function(parent, dataset, view_id, options) {
            this._super(parent, dataset, view_id, options);
        },
        start: function () {
            this._super();
            //alert(this.$('oe_group_header').getAttribute('group-id'));
        },
        do_search: function (domain, context, group_by) {
            this.page = 0;
            this.groups.datagroup = new DataGroup(
                this, this.model, domain, context, group_by);
            this.groups.datagroup.sort = this.dataset._sort;

            if (_.isEmpty(group_by) && !context['group_by_no_leaf']) {
                group_by = null;
            }
            this.no_leaf = !!context['group_by_no_leaf'];
            this.grouped = !!group_by;

            /*
             //Esto estaba anteriormente y provoca una recursividad. No tiene sentido cargar la vista en el do_search.
             //se busca cuando la vista está cargada
             return this.alive(this.load_view(context)).then(
             this.proxy('reload_content'));
             */
            this.reload_content();
        },
        group_clicked: function (group) {
            this.getParent().show_location_view(group);
        },
        child_clicked: function (child) {
            this.getParent().show_component_view(child);
        },
    });

    return {
        ComponentListView: ComponentListView,
    };
});