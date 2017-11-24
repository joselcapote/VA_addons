/**
 * Created by capote on 18/08/2017.
 */
odoo.define('component_explorer.ComponentExplorerView', function (require) {
    "use strict";

    var core = require('web.core');
    var _lt = core._lt;
    var _t = core._t;
    var _ = require('_');
    var QWeb = core.qweb;
    var View = require('web.View');
    var Widget = require('web.Widget');
    var ListView = require('web.ListView');
    var TreeView = require('web.TreeView');
    var FormView = require('web.FormView');
    var common = require('web.form_common');
    var form_common = require('web.form_common');
    var KanbanView = require('web_kanban.KanbanView');
    var data = require('web.data');
    var Model = require('web.Model');
    var Dialog = require('web.Dialog');
    var Class = require('web.Class');

    var widgets = require('component_explorer.widgets');

    var KanbanRecord = require('web_kanban.Record');

    KanbanRecord.include({
        valid: function (funct) {
            if (this.getParent()){
                if (this.getParent().getParent()){
                    if (this.getParent().getParent()[funct]){
                        return true;
                    }
                }
            }
            return false;
        },
        on_card_clicked: function () {
            if (this.model === 'component.site') {
                if (this.valid("show_location_view")){
                    this.getParent().getParent().show_location_view(this.id);
                }
            } else if (this.model === 'component.location') {
                if (this.valid("show_location_mixed_view")){
                    this.getParent().getParent().show_location_mixed_view(this.id);
                }
            } else if (this.model === 'component.sublocation') {
                if (this.valid("show_component_view")){
                    this.getParent().getParent().show_component_view(this.model, this.id);
                }
            }
        },
    });

    var BaseFormView = View.extend({
        init: function (parent, dataset, view_id, options) {
            this._super(parent);
            this.view_manager = parent;
            this.tags_registry = core.form_tag_registry;
            this.searchable = false;
            this.headless = true;
            this.tags_to_init = [];
        },
        attach_node_attr: function($new_element, $node, attr) {
            $new_element.data(attr, $node.attr(attr));
        },
        render_element: function(template /* dictionaries */) {
            var dicts = [].slice.call(arguments).slice(1);
            var dict = _.extend.apply(_, dicts);
            dict['classnames'] = dict['class'] || ''; // class is a reserved word and might caused problem to Safari when used from QWeb
            return $(QWeb.render(template, dict));
        },
        process_notebook: function($notebook) {
            var self = this;
            // Extract useful info from the notebook xml declaration
            var pages = [];
            $notebook.find('> page').each(function() {
                var $page = $(this);
                var page_attrs = $page.getAttributes();
                page_attrs.id = _.uniqueId('notebook_page_');
                page_attrs.contents = $page.html();
                page_attrs.ref = $page;  // reference to the current page node in the xml declaration
                pages.push(page_attrs);
            });
            // Render the notebook and replace $notebook with it
            var $new_notebook = self.render_element('FormRenderingNotebook', {'pages': pages});
            $notebook.before($new_notebook).remove();

            // Bind the invisibility changers and find the page to display
            var pageid_to_display;
            _.each(pages, function(page) {
                var $tab = $new_notebook.find('a[href=#' + page.id + ']').parent();
                var $content = $new_notebook.find('#' + page.id);

                // Case: <page autofocus="autofocus">;
                // We attach the autofocus attribute to the node because it can be useful during the
                // page execution
                self.attach_node_attr($tab, page.ref, 'autofocus');
                self.attach_node_attr($content, page.ref, 'autofocus');
                if (!pageid_to_display && page.autofocus) {
                    // If multiple autofocus, keep the first one
                    pageid_to_display = page.id;
                }

                // Case: <page attrs="{'invisible': domain}">;
                self.handle_common_properties($tab, page.ref, common.NotebookInvisibilityChanger);
                self.handle_common_properties($content, page.ref, common.NotebookInvisibilityChanger);
            });
            if (!pageid_to_display) {
                pageid_to_display = $new_notebook.find('div[role="tabpanel"]:not(.o_form_invisible):first').attr('id');
            }

            // Display page. Note: we can't use bootstrap's show function because it is looking for
            // document attached DOM, and the form view is only attached when everything is processed
            $new_notebook.find('a[href=#' + pageid_to_display + ']').parent().addClass('active');
            $new_notebook.find('#' + pageid_to_display).addClass('active');

            self.process($new_notebook.children());
            self.handle_common_properties($new_notebook, $notebook);

            return $new_notebook;
        },
        handle_common_properties: function($new_element, $node, InvisibilityChanger) {
            var str_modifiers = $node.attr("modifiers") || "{}";
            var modifiers = JSON.parse(str_modifiers);
            var ic = null;
            if (modifiers.invisible !== undefined) {
                var InvisibilityChangerCls = InvisibilityChanger || common.InvisibilityChanger;
                ic = new InvisibilityChangerCls(this.view, this.view, modifiers.invisible, $new_element);
            }
            $new_element.addClass($node.attr("class") || "");
            $new_element.attr('style', $node.attr('style'));
            return {invisibility_changer: ic,};
        },
        process: function($tag) {
            var self = this;
            var tagname = $tag[0].nodeName.toLowerCase();
            if (this.tags_registry.contains(tagname)) {
                this.tags_to_init.push($tag);
                return (tagname === 'button') ? this.process_button($tag) : $tag;
            }
            var fn = self['process_' + tagname];
            if (fn) {
                var args = [].slice.call(arguments);
                args[0] = $tag;
                return fn.apply(self, args);
            } else {
                if( tagname === 'header') {
                    $tag.addClass('o_statusbar_buttons');
                }
                // generic tag handling, just process children
                $tag.children().each(function() {
                    self.process($(this));
                });
                self.handle_common_properties($tag, $tag);
                $tag.removeAttr("modifiers");
                return $tag;
            }
        },
        process_button: function ($button) {
            var self = this;
            $button.children().each(function() {
                self.process($(this));
            });
            return $button;
        },
        set_tags_registry: function(tags_registry) {
            this.tags_registry = tags_registry;
        },
        do_action: function (r) {
            this.view_manager.do_action(r);
        },
    });

    var CExplorerPropertiesFormView = FormView.extend({
        init: function (parent, dataset, view_id, options) {
            this._super(parent, dataset, view_id, options);
            this.view_manager = parent;
            this.tags_registry = core.form_tag_registry;
            this.searchable = true;
            this.model = dataset.model;
        },
        render_buttons: function ($node) {
            this.$buttons = $(QWeb.render("CExplorerFormView.buttons", {'widget': this}));
            $node = $node || this.options.$buttons;
            if (this.$('.oe_form_buttons')) {
                this.$('.oe_form_buttons').replaceWith(this.$buttons);
            } else {
                this.$buttons.appendTo($node);
            }
            var self = this;
            this.$buttons.on('click', '.oe_form_button_edit',
                function () {
                    var action = self.edit_record();
                    self.do_action(action);
                });
        },
        edit_record: function () {
            var self = this;
            if ((this.datarecord != undefined)&&(
                this.datarecord != null)){
                var action = {
                    type: 'ir.actions.act_window',
                    res_model: this.model,
                    res_id: this.datarecord.id,
                    views: [[false, 'form']],
                    target: 'new',
                    flags: {
                        action_buttons: true,
                        create: false,
                    }
                };
                return action
            }
            return ;
        },
        do_action: function (r) {
            var self = this;
            if (r){
                this.view_manager.do_action(r, {
                    on_close: function() {
                        alert("on_close");
                    },
                });
            }
        },
    });

    var DatasetMap = Class.extend({
        init: function() {
            this.pairs = [];
        },
        add_model: function (model, dataset) {
            this.pairs.push({
                dataset: dataset,
                model: model
            });
        },
        get_dataset: function (model) {
            for(var i = 0; i< this.pairs.length; i++){
                if (this.pairs[i].model == model){
                    return this.pairs[i].dataset;
                }
            }
            return null;
        }
    });

    var ComponentExplorerView = BaseFormView.extend({
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
            this.right_panel_view = null;
            this.list_view = null;
            this.project_dataset = new data.DataSetSearch(this, "component.project", this.get_context());
            this.location_dataset = new data.DataSetSearch(this, "component.location", this.get_context());
            this.sublocation_dataset = new data.DataSetSearch(this, "component.sublocation", this.get_context());
            this.site_dataset = new data.DataSetSearch(this, "component.site", this.get_context());
            this.component_dataset = new data.DataSetSearch(this, "component.component", this.get_context());
            this.datasets = new DatasetMap();
            this.datasets.add_model("component.project",this.project_dataset);
            this.datasets.add_model("component.location", this.location_dataset);
            this.datasets.add_model("component.sublocation", this.sublocation_dataset);
            this.datasets.add_model("component.component", this.component_dataset);
            this.datasets.add_model("component.site",this.site_dataset);
            //alert(JSON.stringify(this.datasets)+"\n"+this.datasets.get_dataset("component.project"));
            this.tree_loaded = false;
        },
        get_default_device_options: function () {
            return {
                // records can be selected one by one
                selectable: true,
                // list rows can be deleted
                deletable: true,
                // whether the column headers should be displayed
                header: true,
                // display addition button, with that label
                addable: false,
                // whether the list view can be sorted, note that once a view has been
                // sorted it can not be reordered anymore
                sortable: true,
                // whether the view rows can be reordered (via vertical drag & drop)
                reorderable: false,
                action_buttons: true,
                //whether the editable property of the view has to be disabled
                disable_editable_mode: true,
            };
        },
        get_default_properties_options: function () {
            return {
                action_buttons: true,
                create: false,
                edit: true,
                editable: 'top',
            }
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
            this.process_notebook(this.$("notebook"));
            this.load_treeview();
            //creando la vista de kanban para los locations, debe tener un resumen de los objetos que contiene y poder navegar
            // hacia adentro
            this.show_location_view();
            this.load_devices();
        },
        load_devices: function () {
            var self = this;
            this.device_panel_parent = this.$(".o_cexplorer_devices");
            this.view_model.query(['id','name','type']).filter([['name','=','Device tree']]).all().then(function(view) {
                self.device_view = new TreeView(self, self.component_dataset, view.id, self.get_default_device_options());
                self.device_view.appendTo(self.device_panel_parent);
                self.device_view.load_view();
                self.device_view.on("view_loaded", self, function (fields_view) {
                    self.device_view.do_search(self.get_device_domain(), self.options.context, []);
                })
            });
        },
        load_treeview: function () {
            if ((this.$("#tree")) != undefined){
                this.$("#tree").remove();
            }
            this.list_view = new widgets.ProjectTreeView(this);
            this.list_view.appendTo(this.$('.o_cexplorer_sidebar_container'));
        },
        on_view: function () {
        },
        remove_view: function (view) {
            $(view).detach();
            view.destroy();
            if ($('.o_kanban_view') != null){
                $('.o_kanban_view').detach();
            }
            if ($('.oe_form') != null){
                $('.oe_form').detach();
            }
        },
        get_project_domain: function (project) {
            var domain = this.options.domain;
            if (project != undefined){
                domain = [["project_id","=",Number(project)]];
            }
            return domain;
        },
        get_device_domain: function () {
            var domain = [];
            //Aqui hay que establecer las opciones de busqueda para el tree de los devices
            return domain;
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
            this.$(".o_cexplorer_view").children().detach();
        },
        new_record_action: function (model) {
            var action = {
                type: 'ir.actions.act_window',
                res_model: model,
                views: [[false, 'form']],
                target: 'new',
                flags: {
                    action_buttons: true,
                    create: true,
                }
            };
            return action
        },
        add_project: function () {
            var self = this;
            this.view_manager.do_action(this.new_record_action("component.project"), {
                on_close: function() {
                    self.load_treeview();
                },
            });
        },
        show_properties_action: function (model, id) {
            var action = {
                type: 'ir.actions.act_window',
                res_model: model,
                res_id: Number(id),
                views: [[false, 'form']],
                target: 'new',
                flags: {
                    action_buttons: true,
                    create: false,
                }
            };
            return action
        },
        show_properties: function (model, id) {
            var self = this;
            this.view_manager.do_action(this.show_properties_action(model, id), {
                on_close: function() {
                    self.load_treeview();
                },
            });
        },
        show_site_view: function (project) {
            var self = this;
            this.right_panel_parent = this.$(".o_cexplorer_view");
            this.current_project = project;
            this.current_model = "component.site";
            this.list_view.activate_project_node(project);
            this.remove_any_previous_view();
            this.view_model.query(['id','name','type']).filter([['name','=','Site Kanban Explorer']]).first().then(function(view) {
                self.right_panel_view = new widgets.CExplorerKanbanView(self, self.site_dataset, view.id, self.get_default_kanban_options("location"));
                self.right_panel_view.appendTo(self.right_panel_parent);
                self.right_panel_view.load_view();
                self.right_panel_view.on("view_loaded", self, function (fields_view) {
                    self.right_panel_view.do_search(self.get_project_domain(self.current_project), self.options.context, []);
                    $(".oe_delete_item").on("click", function () {

                    });
                    self.active_view = self.right_panel_parent;
                })
            });
        },
        show_property_view: function (model, id) {
            var self = this;
            this.property_panel_parent = this.$(".o_cexplorer_properties");
            if (this.property_view!=null){
                this.remove_view(this.property_view);
            }
            this.view_model.query(['id','name','type']).filter([['model','=',model],
                ['type','=','form']]).first().then(function(view) {
                self.property_view = new CExplorerPropertiesFormView(self, self.datasets.get_dataset(model), view.id, self.get_default_properties_options());
                self.property_view.appendTo(self.property_panel_parent);
                self.property_view.on("view_loaded", self, function (fields_view) {
                    var domain = [["id","=",Number(id)]];
                    self.datasets.get_dataset(model).read_slice([], {domain: domain}).done(function (records) {
                        if (records.length != 0){
                            self.property_view.load_record(records[0]);
/*
                            self.property_view.render_buttons($(".o_cexplorer-properties-buttons"));
*/
                        }
                    })
                })
            });
        },
        //Single Line Diagram View
        show_sld_view: function (model, id) {
            var self = this;
            this.$("#map").detach();
            this.$(".o_cexplorer_sld").append("<div id='map' style='width: 800px; height: 400px' />");
            this.map = new OpenLayers.Map("map");
            //this.map.updateSize();
            this.datasets.get_dataset(model).read_slice([], [["id","=",Number(id)]]).done(function (records) {
                if (records.length != 0){
                    if ((records[0]['single_line_diagram'] != undefined)&&(records[0]['single_line_diagram'] != null)){
                        var src = "data:image/png;base64,"+ records[0]['single_line_diagram'];
                        var bounds = new OpenLayers.Bounds(-180, -88.759, 180, 88.759);

                        var img = new Image();
                        img.src = src;
                        img.onload = function() {
                            self.imageLayer = new OpenLayers.Layer.Image(
                                "Single Line Diagram",
                                src,
                                bounds,
                                new OpenLayers.Size(img.width, img.height),
                                {numZoomLevels: 3}
                            );
                            self.map.addLayer(self.imageLayer);
                            self.map.zoomToExtent(bounds);
                        }
                    }
                }
            })
        },
        load_location_view: function (view) {
            var self = this;
            self.right_panel_view = new widgets.CExplorerKanbanView(self, self.location_dataset, view.id, self.get_default_kanban_options("location"));
            self.right_panel_view.appendTo(self.right_panel_parent);
            self.right_panel_view.load_view();
            self.right_panel_view.on("view_loaded", self, function (fields_view) {
                self.right_panel_view.do_search(self.get_site_domain(self.current_site), self.options.context, []);
                $(".oe_delete_item").on("click", function () {

                });
                $(".o-kanban-button-new").parent().detach();
                self.active_view = self.right_panel_parent;
            })

        },
        show_location_view: function (site) {
            this.right_panel_parent = this.$(".o_cexplorer_view");
            var location_view = new widgets.LocationView(this, site);
            location_view.appendTo(this.right_panel_parent);
        },
        show_location_mixed_view: function (sublocation) {
            this.right_panel_parent = this.$(".o_cexplorer_view");
            var prev_view = this.$(".oe_mixed_view");
            if (prev_view){
                prev_view.detach();
            }
            var component_view = new widgets.SublocationComponentMixedView(this, sublocation);
            component_view.appendTo(this.right_panel_parent);
        },
        show_component_view: function (model, id, where) {
            this.right_panel_parent = this.$(".o_cexplorer_view");
            var component_view_parent = this.right_panel_parent;
            if (where){
                component_view_parent = where;
            }
            var component_view = new widgets.ComponentsView(this, id, model);
            component_view.appendTo(component_view_parent);
        },
        do_switch_view: function(model, context){
            var self = this;
            this.view_model.query(['id','name','type']).filter([['model','=',model], ['type','=','form']]).first().then(function(view) {
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
        add_record: function(model, context) {
            if (model){
                this.current_model = model;
            }
            if (this.current_model == "component.component") {
                var self = this;
                this.select_component_model(function (dialog) {
                    self.do_switch_view(self.selected_component_model, context);
                });
            }else if (this.current_model == "component.site"){
                this.do_switch_view("component.site");
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
        delete_project: function (id) {
            var self = this;
            this.project_dataset.unlink([Number(id)]).done(function () {
                self.list_view.reload_content();
            });
        },
        delete_site: function (id) {
            var self = this;
            this.site_dataset.unlink([Number(id)]).done(function () {
                self.list_view.reload_content();
            });
        },
        delete_location: function (id) {
            var self = this;
            this.location_dataset.unlink([Number(id)]).done(function () {
                self.list_view.reload_content();
            });
        }
    });

// static method to open simple confirm dialog

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
