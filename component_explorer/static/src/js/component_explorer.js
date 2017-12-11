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

    var BaseFormView = View.extend({
        init: function (parent, dataset, view_id, options) {
            this._super(parent);
            this.view_manager = parent;
            this.tags_registry = core.form_tag_registry;
            //this.searchable habilita la barra de búsqueda pero todavía da problemas
            this.searchable = true;
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
                        //alert("on_close");
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
            this.$(".o_cexplorer_sidebar_container").css("height", "100%");
            var self = this;
            this.view_model = new Model('ir.ui.view');
            this.process_notebook(this.$("notebook"));

            this.$('[role="tab"]').each(function(index) {
                 switch (index){
                     case 0:
                         $( this ).parent().addClass( "explorer_page" );
                         break;
                     case 1:
                         $( this ).parent().addClass( "properties_page" );
                         break;
                     case 2:
                         $( this ).parent().addClass( "sld_page" );
                         break;
                 }
            });

            this.load_treeview();
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
        get_treeview: function () {
            return this.list_view;
        },
        load_treeview: function (locations, sublocations) {
            if ((this.$("#tree")) != undefined){
                this.$("#tree").remove();
            }
            this.list_view = new widgets.ProjectTreeView(this, locations, sublocations);
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
                },
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
            };
            return action
        },
        process_dataset_command: function(model, parent_id,  command){
            var self = this;
            var id = command[1];
            if (!id || _.isString(id) || _.isNumber(id)) {
                switch (command[0]) {
                    case form_common.commands.CREATE:
                        var component = {'parent_id': parent_id, 'parent_model': model};
                        for (var propiedad in command[2]) {
                            component[propiedad] = command[2][propiedad];
                        }
                        var dataset = new data.DataSet(self, component.component_model, {});
                        dataset.create(component, {}).then(function (id) {
                            component['id'] = id;
                            self.trigger('write_completed saved', component);
                            return;
                        });
                        break;
                    case form_common.commands.UPDATE:
                        return dataset.write(id, command[2], internal_options).then(function () {
                            if (dataset.ids.indexOf(id) === -1) {
                                dataset.ids.push(id);
                            }
                        });
                    case form_common.commands.FORGET:
                    case form_common.commands.DELETE:
                        var dataset = new data.DataSet(self, "component.component", {});
                        return dataset.unlink([id]).done(function () {
                            self.update_view_by_model(model, parent_id);
                        });
                    case form_common.commands.LINK_TO:
/*
                        var dataset = new data.DataSet(self, model, {});
                        if (dataset.ids.indexOf(id) === -1) {
                            return dataset.add_ids([id], internal_options);
                        }
                        return;
*/
                    case form_common.commands.DELETE_ALL:
/*
                        var dataset = new data.DataSet(self, model, {});
                        return dataset.reset_ids([], {keep_read_data: true});
*/
                    case form_common.commands.REPLACE_WITH:
/*
                        var dataset = new data.DataSet(self, model, {});
                        dataset.ids = [];
                        return dataset.alter_ids(command[2], internal_options);
*/
                }
            }
        },
        show_properties: function (model, id) {
            var self = this;
            this.view_model.query(['id','name','type']).filter([['model','=',model], ['type','=','form']]).first().then(function(view) {
                if (self.prev_form_dialog) {
                    self.prev_form_dialog.destroy();
                }
                self.prev_form_dialog = new form_common.FormViewDialog(self, {
                    res_model: model,
                    title: "Edit..",
                    view_id: view.id,
                    res_id: id,
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
                    ],
                    write_function: function(id, withdata, options) {
                        if (withdata.component_ids){
                            for(var i = 0; withdata.component_ids.length; i++){
                                self.process_dataset_command(model, id, withdata.component_ids[i]);
                            }
                        }
                        var dataset = new data.DataSet(self, model, {});
                        return dataset.write(id, withdata, {});
                    }
                }).open();
                self.prev_form_dialog.on('write_completed', self, function() {
                    self.show_property_view(model, id);
                });
            });
        },
        show_site_view: function (project) {
            this.right_panel_parent = this.$(".o_cexplorer_view");
            this.$(".o_cexplorer_view").children().remove();
            var site_view = new widgets.SiteView(this, project);
            site_view.appendTo(this.right_panel_parent);
        },
        show_project_view: function () {
            this.right_panel_parent = this.$(".o_cexplorer_view");
            this.$(".o_cexplorer_view").children().remove();
            var project_view = new widgets.ProjectView(this);
            project_view.appendTo(this.right_panel_parent);
        },
        hide_property_view: function () {
            this.$(".o_cexplorer_properties").hide();
        },
        show_property_view: function (model, id) {
            var self = this;
            this.$(".o_cexplorer_properties").show();
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
                        }
                    })
                })
            });
        },
        //Single Line Diagram View
        hide_sld_view: function () {
            this.$(".o_cexplorer_sld").hide();
            this.$(".sld_page").css( "visibility", "hidden" );
        },
        fix_bounds: function (bounds, width, height) {
            var scale_factor = width/height;
            var cy = (bounds.bottom + bounds.top)/2;
            // alert(cy+','+bounds.bottom);
            var new_height = bounds.getWidth()/scale_factor;
            // alert(new_height);
            var image_bounds = new OpenLayers.Bounds(bounds.left, cy-(new_height/2), bounds.right, cy+(new_height/2));
            image_bounds = image_bounds.scale(0.25);
            return image_bounds;
            // return bounds;
        },
        show_sld_view: function (model, id) {
            var self = this;
            this.$("#map").detach();
            this.$(".o_cexplorer_sld").show();
            this.$(".sld_page").css( "visibility", "visible" );
            var width = 800;
            var height = 400;
            var sld_element = document.getElementsByClassName("o_cexplorer_sld").item(0);
            if (sld_element.clientWidth > 0){
                width = sld_element.clientWidth;
            }
            if (sld_element.clientHeight > 0){
                height = sld_element.clientHeight;
            }
            var map_div = "<div id='map' style='width: "+width+"px; height: "+height+"px' />";
            this.$(".o_cexplorer_sld").append(map_div);
            OpenLayers.ImgPath = "/component/static/lib/OpenLayers/img/";
            var bounds = new OpenLayers.Bounds(-180, -90, 180, 90);
            var options = {
                projection: "EPSG:4326",
                restrictedExtent: bounds,
                center: bounds.getCenterLonLat(),
                zoom: 5,
            };
            this.map = new OpenLayers.Map("map", options);
            var base_layer = new OpenLayers.Layer.Image(
                "Base",
                "/component_explorer/static/bg_layer.png",
                bounds,
                new OpenLayers.Size(2048, 1024),
                {}
            );
            this.map.addLayer(base_layer);
            this.datasets.get_dataset(model).read_slice([], [["id","=",Number(id)]]).done(function (records) {
                if (records.length != 0){
                    if ((records[0]['single_line_diagram'] != undefined)&&(records[0]['single_line_diagram'] != null)){
                        var src = "data:image/png;base64,"+ records[0]['single_line_diagram'];
                        var img = new Image();
                        img.src = src;
                        img.onload = function() {
                            var img_bounds = self.fix_bounds(bounds, img.width, img.height);
                            var imageLayer = new OpenLayers.Layer.Image(
                                "Single Line Diagram",
                                src,
                                img_bounds,
                                new OpenLayers.Size(img.width, img.height),
                                {isBaseLayer: false, alwaysInRange: true}
                            );
                            self.map.addLayer(imageLayer);
                            self.map.zoomToMaxExtent();
                        }
                    }
                }
            })
        },
        show_location_view: function (site) {
            this.right_panel_parent = this.$(".o_cexplorer_view");
            this.$(".o_kanban_view").remove();
            var location_view = new widgets.LocationView(this, site);
            location_view.appendTo(this.right_panel_parent);
        },
        show_location_mixed_view: function (location) {
            this.right_panel_parent = this.$(".o_cexplorer_view");
            this.$(".oe_mixed_view").remove();
            var component_view = new widgets.SublocationComponentMixedView(this, location);
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
        get_parent_model: function (model) {
            if (model == 'component.site'){
                return 'component.project';
            }else if (model == 'component.location'){
                return 'component.site';
            }else if (model == 'component.sublocation'){
                return 'component.location';
            }
            return null;
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
                                var id = -1;
                                var parent_model = self.get_parent_model(model);
                                if (context['default_parent_id']){
                                    id = context['default_parent_id'];
                                    parent_model = context['default_parent_model'];
                                }else if (context['default_site_id']){
                                    id = context['default_site_id'];
                                }else if (context['default_location_id']){
                                    id = context['default_location_id'];
                                }else if (context['default_project_id']){
                                    id = context['default_project_id'];
                                }
                                if (id != -1){
                                    $.when(self.list_view.reload_content()).then(function () {
                                        self.list_view.activate_node_by_model(parent_model, id);
                                    });
                                }else{
                                    self.list_view.activate_node_by_key('root');
                                }
                            });
                        }},
                        {text: _t("Close"), close: true}
                    ]
                }).open();
            });
        },
        update_view_by_model: function (model, id) {
            var predicate = model.split('\.')[1];
            this.update_view(predicate, id);
        },
        update_view: function (model_predicate, id) {
            var full_model = 'component.'+model_predicate;
            if (model_predicate == 'project') {
                this.show_site_view(id);
                this.show_property_view(full_model, id);
                this.hide_sld_view();
            } else if (model_predicate == 'site') {
                this.show_location_view(id);
                this.show_property_view(full_model, id);
                this.show_sld_view(full_model, id);
            } else if (model_predicate == 'location') {
                this.show_location_mixed_view(id);
                this.show_property_view(full_model, id);
                this.show_sld_view(full_model, id);
            } else if (model_predicate == 'sublocation') {
                this.show_component_view(full_model, id);
                this.show_property_view(full_model, id);
                this.show_sld_view(full_model, id);
            }
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
            }else{
                this.do_switch_view(model, context);
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
                componentModel.query(['id', 'parent_id', 'parent_model']).filter(this.current_query).all().then(function(components) {
                    if (components.length > 0){
                        var locations = [];
                        var sublocations = [];
                        for(var i= 0; i < components.length; i++){
                            if (components[i].parent_model == 'component.location'){
                                locations.push(components[i].parent_id[0]);
                            }else{
                                sublocations.push(components[i].parent_id[0]);
                            }
                        }
                        self.load_treeview(locations, sublocations);
                    }
                });
            }else{
                this.location_dataset = new data.DataSetSearch(this, "component.location", this.get_context());
                this.load_treeview();
            }
        },
        delete_component: function (id) {
            var dataset = new data.DataSet(self, "component.component", {});
            this.remove_record(dataset, id);
        },
        delete_project: function (id) {
            this.remove_record(this.project_dataset, id);
        },
        delete_site: function (id) {
            this.remove_record(this.site_dataset, id);
        },
        remove_record: function (dataset, id) {
            var self = this;
            Dialog.confirm(this, _t("Are you sure you want to delete this record ?"), {confirm_callback: function () {
                return $.when(dataset.unlink([id])).done(function () {
                    Dialog.alert(this, _t("Changes where done."));
                    self.list_view.reload_content();
                    return true;
                });
            }});
        },
        delete_location: function (id) {
            this.remove_record(this.location_dataset, id);
        },
        delete_sublocation: function (id) {
            this.remove_record(this.sublocation_dataset, id);
        }
    });

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
