/**
 * Created by capote on 18/08/2017.
 */
odoo.define('component_explorer.ComponentExplorerView', function (require) {
    "use strict";

    var core = require('web.core');
    var _lt = core._lt;
    var _t = core._t;
    var QWeb = core.qweb;
    var View = require('web.View');
    var Widget = require('web.Widget');
    var ListView = require('web.ListView');
    var TreeView = require('web.TreeView');
    var FormView = require('web.FormView');
    var form_common = require('web.form_common');
    var KanbanView = require('web_kanban.KanbanView');
    var data = require('web.data');
    var Model = require('web.Model');
    var Dialog = require('web.Dialog');

    var widgets = require('component.widgets');

    var KanbanRecord = require('web_kanban.Record');

    KanbanRecord.include({
        on_card_clicked: function () {
            if (this.model === 'component.location') {
                alert(this.getParent().getParent());
                this.getParent().getParent().show_component_view(this.id);
            } else {
                this._super.apply(this, arguments);
            }
        },
    });

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
            this.right_panel_view = null;
            this.list_view = null;
            this.location_dataset = new data.DataSetSearch(this, "component.location", this.get_context());
            this.tree_loaded = false;
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
        start: function () {
            this._super();
            var self = this;
            this.view_model = new Model('ir.ui.view');
            this.load_treeview();
            this.right_panel_parent = this.$(".o_cexplorer_view");
            this.$(".o_cexplorer_view").show_component_view = function (location) {
                this.show_component_view(location);
            }
            //creando la vista de kanban para los locations, debe tener un resumen de los objetos que contiene y poder navegar
            // hacia adentro
            this.show_location_view();
        },
        load_treeview: function () {
            var list_options = {
                // records can be selected one by one
                selectable: false,
                // list rows can be deleted
                deletable: true,
                // whether the column headers should be displayed
                header: true,
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
            if (this.list_view != null){
                $(this.list_view).detach();
                this.list_view.destroy();
            }
            var self = this;
            this.view_model.query(['id','name','type']).filter([['name','=','Place Tree View']]).first().then(function(view) {
                var tree_parent = self.$(".o_cexplorer_sidebar_container");
                self.list_view = new widgets.ComponentListView(self, self.location_dataset, view.id, list_options);
                self.list_view.appendTo(tree_parent);
                self.list_view.load_view();
                self.list_view.on("view_loaded", self, function (fields_view) {
                    self.list_view.groups.datagroup.group_by = ['site_id'];
                    self.list_view.reload();
                });
            });
        },
        on_view: function () {
        },
        do_action: function (r) {
            this.view_manager.do_action(r);
        },
        remove_view: function (view) {
            $(view).detach();
            view.destroy();
            if ($('.o_kanban_view') != null){
                $('.o_kanban_view').detach();
            }
        },
        get_site_domain: function (site) {
            var domain = this.options.domain;
            if (site != undefined){
                domain = [["site_id","=",Number(site)]];
            }
            return domain;
        },
        get_location_domain: function (location, query) {
            var domain = this.options.domain;
            if (location != undefined){
                domain = [["location_id","=",Number(location)]];
            }
            return domain;
        },
        remove_any_previous_view: function () {
            if (this.right_panel_view != null){
                this.remove_view(this.right_panel_view);
                this.right_panel_view = null;
            }
        },
        show_location_view: function (site) {
            var self = this;
            this.current_site = site;
            this.current_model = "component.location";
            this.remove_any_previous_view();
            this.view_model.query(['id','name','type']).filter([['name','=','Place Kanban Explorer']]).first().then(function(view) {
                self.right_panel_view = new CExplorerKanbanView(self, self.location_dataset, view.id, self.get_default_kanban_options("location"));
                self.right_panel_view.appendTo(self.right_panel_parent);
                self.right_panel_view.load_view();
                self.right_panel_view.on("view_loaded", self, function (fields_view) {
                    self.right_panel_view.do_search(self.get_site_domain(self.current_site), self.options.context, []);
                    $(".oe_delete_item").on("click", function () {

                    });
                    $(".oe_component_by_location_view").show_component_view = function (location) {
                        alert(location);
                    };
                    $(".o-kanban-button-new").parent().detach();
                    self.right_panel_view.render_buttons($(".o_cexplorer-cp-buttons"));
                    self.active_view = self.right_panel_parent;
                })
            });
        },
        show_component_view: function (location) {
            var self = this;
            this.current_location = location;
            this.current_model = "component.component";
            this.remove_any_previous_view();
            this.view_model.query(['id','name','type']).filter([['name','=','Component Kanban']]).first().then(function(view) {
                //var options = {"view_id": view.id, "view_type": view.type, "context": self.context, "toolbar": false};
                self.right_panel_view = new CExplorerKanbanView(self, self.dataset, view.id, self.get_default_kanban_options("component"));
                self.right_panel_view.appendTo(self.right_panel_parent);
                self.right_panel_view.load_view();
                self.right_panel_view.on("view_loaded", self, function (fields_view) {
                    var context = {"default_site_id": self.current_site, "default_location_id": self.current_location};
                    var location_domin = self.get_location_domain(self.current_location, self.current_query);
                    //alert(JSON.stringify(location_domin)+"\nlocation:"+self.current_location+"\nquery:"+self.current_query);
                    self.right_panel_view.do_search(location_domin, context, []);
                    $(".o-kanban-button-new").parent().detach();
                    self.right_panel_view.render_buttons($(".o_cexplorer-cp-buttons"));
                })
            });
        },
        do_switch_view: function(model){
            var self = this;
            this.view_model.query(['id','name','type']).filter([['model','=',model], ['type','=','form']]).first().then(function(view) {
                var context = {"default_site_id": Number(self.current_site), "default_location_id": Number(self.current_location)};
                if (self.prev_form_dialog){
                    self.prev_form_dialog.destroy();
                }
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
                                if (self.current_model == "component.component"){
                                    self.show_component_view(self.current_location);
                                }else{
                                    self.show_location_view(self.current_site);
                                    self.list_view.reload_content();
                                }
                            });
                        }},
                        {text: _t("Close"), close: true}
                    ]
                }).open();
/*
                self.right_panel_view = new FormView(self, self.dataset, view.id, context);
                self.right_panel_view.appendTo(self.right_panel_parent);
                //self.right_panel_view.load_view();
                self.right_panel_view.on("view_loaded", self, function (fields_view) {
                    self.right_panel_view.do_show().then(function() {
                        self.do_show();
                    });
                    $(".o-kanban-button-new").parent().detach();
                    self.right_panel_view.render_buttons($(".o_cexplorer-cp-buttons"));
                })
*/
            });
        },
        add_record: function() {
            if (this.current_model == "component.component"){
                var self = this;
                this.select_component_model(function (dialog) {
                    self.do_switch_view(self.selected_component_model);
/*
                    var action = self.get_create_action(_lt("New component"), self.selected_component_model);
                    self.do_action(action);
*/
                });
            }else if (this.right_panel_view != null){
                this.do_switch_view("component.location");
                //this.do_action(this.get_create_action(_lt("New location"), "component.location"));
            }
        },
        select_component_model: function (do_it) {
            var component_types = [];
            component_types.push({title: "LV AC Cable", model: "component.lv_ac_cable"});
            component_types.push({title: 'SWR', model: "component.swr_component"});
            //component_types.push({title: 'Switch', model: "component.switch"});
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
        do_search: function(domain, context, group_by) {
            this.current_query = domain;
            if ((this.current_query != undefined)&&(this.current_query.length > 0)){
                var componentModel = new Model("component.component");
                var self = this;
                componentModel.query(['id', 'location_id']).filter(this.current_query).all().then(function(components) {
                    if (components.length > 0){
                        var locations = [];
                        for(var i= 0; i < components.length; i++){
                            locations.push(components[i].location_id[0]);
                        }
                        var locations_domain = [["id", "in", locations]];
                        self.location_dataset = new data.DataSetSearch(self, "component.location", self.get_context(), locations_domain);
                        alert(self.location_dataset.size());
                        self.load_treeview(locations_domain);
                    }
                });
            }else{
                this.location_dataset = new data.DataSetSearch(this, "component.location", this.get_context());
                this.load_treeview();
            }
        },
    });

// static method to open simple confirm dialog
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
    });

/*
    ListView.include({
    });
*/

    ListView.List.include(/** @lends instance.web.ListView.List# */{
        row_clicked: function (e) {
            this._super.apply(this, arguments);
            var row_id = $(e.target).parent().get(0).getAttribute('data-id');
            //alert(e.target.attributes['data-id']);
            if (this.view['child_clicked'] != undefined){
                this.view.child_clicked(row_id);
            }
        },
    });

    ListView.Groups.include({
        init: function (view, options) {
            this._super(view, options);
            $(this).on('group_clicked', function (target, group) {
                this.view.group_clicked(group);
            })
        },
        render_groups: function (datagroups) {
            var self = this;
            var locationholder = this.make_fragment();
            _(datagroups).each(function (group) {
                if (self.children[group.value]) {
                    self.records.proxy(group.value).reset();
                    delete self.children[group.value];
                }
                var child = self.children[group.value] = new (self.view.options.GroupsType)(self.view, {
                    records: self.records.proxy(group.value),
                    options: self.options,
                    columns: self.columns
                });
                self.bind_child_events(child);
                child.datagroup = group;

                var group_id = group.value[0];
                var $row = child.$row = $('<tr class="oe_group_header" group-id="'+group_id+'">');
                $row.on('click', function (e) {
                    var group_id = $(e.target).parents('tr.oe_group_header').get(0).getAttribute('group-id');
                    $(self).trigger('group_clicked', group_id);
                })
                if (group.openable && group.length) {
                    $row.click(function (e) {
                        if (!$row.data('open')) {
                            $row.data('open', true)
                                .find('span.ui-icon')
                                .removeClass('ui-icon-triangle-1-e')
                                .addClass('ui-icon-triangle-1-s');
                            child.open(self.point_insertion(e.currentTarget));
                        } else {
                            $row.removeData('open')
                                .find('span.ui-icon')
                                .removeClass('ui-icon-triangle-1-s')
                                .addClass('ui-icon-triangle-1-e');
                            child.close();
                            // force recompute the selection as closing group reset properties
                            var selection = self.get_selection();
                            $(self).trigger('selected', [selection.ids, this.records]);
                        }
                    });
                }
                locationholder.appendChild($row[0]);

                var $group_column = $('<th class="oe_list_group_name">').appendTo($row);
                // Don't fill this if group_by_no_leaf but no group_by
                if (group.grouped_on) {
                    var row_data = {};
                    row_data[group.grouped_on] = group;
                    var group_label = _t("Undefined");
                    var group_column = _(self.columns).detect(function (column) {
                        return column.id === group.grouped_on; });
                    if (group_column) {
                        try {
                            group_label = group_column.format(row_data, {
                                value_if_empty: _t("Undefined"),
                                process_modifiers: false
                            });
                        } catch (e) {
                            group_label = _.str.escapeHTML(row_data[group_column.id].value);
                        }
                    } else {
                        group_label = group.value;
                        if (group_label instanceof Array) {
                            group_label = group_label[1];
                        }
                        if (group_label === false) {
                            group_label = _t('Undefined');
                        }
                        group_label = _.str.escapeHTML(group_label);
                    }

                    // group_label is html-clean (through format or explicit
                    // escaping if format failed), can inject straight into HTML
                    $group_column.html(_.str.sprintf(_t("%s (%d)"),
                        group_label, group.length));

                    if (group.length && group.openable) {
                        // Make openable if not terminal group & group_by_no_leaf
                        $group_column.prepend('<span class="ui-icon ui-icon-triangle-1-e" style="float: left;">');
                    } else {
                        // Kinda-ugly hack: jquery-ui has no "empty" icon, so set
                        // wonky background position to ensure nothing is displayed
                        // there but the rest of the behavior is ui-icon's
                        $group_column.prepend('<span class="ui-icon" style="float: left; background-position: 150px 150px">');
                    }
                }
                self.indent($group_column, group.level);

                if (self.options.selectable) {
                    $row.append('<td>');
                }
                _(self.columns).chain()
                    .filter(function (column) { return column.invisible !== '1'; })
                    .each(function (column) {
                        if (column.meta) {
                            // do not do anything
                        } else if (column.id in group.aggregates) {
                            var r = {};
                            r[column.id] = {value: group.aggregates[column.id]};
                            $('<td class="oe_number">')
                                .html(column.format(r, {process_modifiers: false}))
                                .appendTo($row);
                        } else {
                            $row.append('<td>');
                        }
                    });
                if (self.options.deletable) {
                    $row.append('<td class="oe_list_group_pagination">');
                }
            });
            return locationholder;
        },
    });

    core.view_registry.add('component_explorer', ComponentExplorerView);
    return ComponentExplorerView;
});
