# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

import logging

from openerp import api
from openerp import tools
from project import model_with_image
from openerp.osv import fields, osv

_logger = logging.getLogger(__name__)

#Este modelo tiene un SingleLineDiagram, se crea porque El Site, Location y Sublocation tienen este atributo
class model_with_sld(model_with_image):
    _name = 'component.sld'
    _description = 'model with single line diagram'
    _inherit = 'component.imaged'

 #   def _get_single_line_diagram(self, cr, uid, ids, name, args, context=None):
 #       result = dict.fromkeys(ids, False)
 #       for obj in self.browse(cr, uid, ids, context=context):
 #           result[obj.id] = tools.image_get_resized_images(obj.single_line_diagram, avoid_resize_medium=True)
 #       return result

#    def _set_single_line_diagram(self, cr, uid, id, name, value, args, context=None):
#        return self.write(cr, uid, [id], {'single_line_diagram': tools.image_resize_image_big(value)}, context=context)

#    def _set_single_line_diagram_medium(self, cr, uid, id, name, value, args, context=None):
#        return self.write(cr, uid, [id], {'single_line_diagram': tools.image_resize_image_big(value),
#                                           'single_line_diagram_medium': tools.image_resize_image_medium(value),
#                                           }, context=context)

    # def _set_single_line_diagram_small(self, cr, uid, id, name, value, args, context=None):
    #     return self.write(cr, uid, [id], {'single_line_diagram': tools.image_resize_image_big(value),
    #                                       'single_line_diagram_small': tools.image_resize_image_small(value),
    #                                       }, context=context)

    _columns = {
        # image: all image fields are base64 encoded and PIL-supported
        'single_line_diagram': fields.binary(string="Single Line Diagram",
                               help="This field holds the image used as Single Line Diagram for the Site or Location, limited to 1024x1024px."),
#        'single_line_diagram_medium': fields.function(_get_single_line_diagram, fnct_inv=_set_single_line_diagram_medium,
#                                        string="Single Line Diagram", type="binary", multi="_get_single_line_diagram",
#                                        store={
#                                            'component.imaged': (lambda self, cr, uid, ids, c={}: ids, ['single_line_diagram'], 10),
#                                        },
#                                        help="Medium-sized image of the Single Line Diagram. It is automatically " \
#                                             "resized as a 128x128px image, with aspect ratio preserved, " \
#                                             "only when the image exceeds one of those sizes. Use this field in form views or some kanban views."),
#        'single_line_diagram_small': fields.function(_get_single_line_diagram, fnct_inv=_set_single_line_diagram_small,
#                                       string="Single Line Diagram", type="binary", multi="_get_single_line_diagram",
#                                       store={
#                                           'component.imaged': (lambda self, cr, uid, ids, c={}: ids, ['single_line_diagram'], 10),
#                                       },
#                                       help="Small-sized image of the Single Line Diagram. It is automatically " \
#                                            "resized as a 64x64px image, with aspect ratio preserved. " \
#                                            "Use this field anywhere a small image is required."),
    }

    @api.multi
    def write(self, vals):
        res = super(model_with_sld, self).write(vals)
        return res

    @api.model
    def create(self, vals):
        res = super(model_with_sld, self).create(vals)
        return res

class site(model_with_sld):
    _name = 'component.site'
    _inherit = "component.sld"

    def _location_count(self, cr, uid, ids, field_name, arg, context=None):
        res = dict.fromkeys(ids, 0)
        locations = self.pool['component.location']
        for site in self.browse(cr, uid, ids, context):
            res[site.id] = locations.search_count(cr, uid, [('site_id',"=",site.id)], context);
        return res;

    _columns = {
        'name':             fields.char('Site Name', required=True, help='An internal identification of the Site'),
        'description':      fields.char('Description', required=True, help='A description of the Site'),
        'project_id':       fields.many2one('component.project','Project'),
        'location_ids':     fields.one2many('component.location', 'site_id', 'Location', help='The list of Location in this Site'),
        'sequence':         fields.integer('Sequence',help='Used to sort Sites'),
        'location_count':   fields.function(_location_count, string='Location count', type='integer'),
    }

    _defaults = {
        'sequence': 1,
    }

    def open_site_view(self, cr, uid, ids, context=None):
        return {
            'type': 'ir.actions.act_window',
            'res_model': "component.site", # this model
            'res_id': ids[0], # the current wizard record
            'view_type': 'form',
            'view_mode': 'form,list',
            'target': 'current'}

    def set_background_color(self, cr, uid, id, background, context=None):
        self.write(cr, uid, [id], {'background_color': background}, context=context)

    @api.multi
    def write(self, vals):
        res = super(site, self).write(vals)
        return res

    @api.model
    def create(self, vals):
        res = super(site, self).create(vals)
        return res

    def unlink(self, cr, uid, ids, context=None):
        if context is None:
            context = {}
        locations = self.pool['component.location']
        location_ids = locations.search(cr, uid, [('site_id', 'in', ids)], context=context)
        locations.unlink(cr, uid, location_ids, context=context)
        res = super(site, self).unlink(cr, uid, ids, context)
        return res


class site_location_base(model_with_sld):
    _name = 'component.locationbase'
    _inherit = "component.sld"

    _columns = {
        'name':         fields.char('Location Name', size=32, required=True, help='An internal identification of a Place'),
        'shape':        fields.selection([('square','Square'),('round','Round')],'Shape', required=True),
        'position_h':   fields.float('Horizontal Position', help="The location's horizontal position from the left side to the location's center, in pixels"),
        'position_v':   fields.float('Vertical Position', help="The location's vertical position from the top to the location's center, in pixels"),
        'width':        fields.float('Width',   help="The location's width in pixels"),
        'height':       fields.float('Height',  help="The location's height in pixels"),
        'color':        fields.char('Color',    help="The location's color, expressed as a valid 'background' CSS property value"),
        'active':       fields.boolean('Active',help='If false, the location is deactivated and will not be available in the point of sale'),
    }

    _defaults = {
        'shape': 'square',
        'seats': 1,
        'position_h': 10,
        'position_v': 10,
        'height': 50,
        'width':  50,
        'active': True,
    }

    def action_get_components_kanban_view(self, cr, uid, ids, context=None):
        ctx = dict()
        for location in self.browse(cr, uid, ids, context):
            ctx.update({
                'default_location_id': location.id,
                'default_site_id': location.site_id.id,
            })
            return {
                'name': ('New component'),
                'view_type': 'kanban',
                'view_mode': 'kanban,list',
                'res_model': 'component.component',
                'context': ctx,
                'domain': str([('location_id', '=', location.id)]),
                'type': 'ir.actions.act_window',
            }

    def create_from_ui(self, cr, uid, location, context=None):
        if location.get('site_id', False):
            site_id = location['site_id'][0]
            location['site_id'] = site_id
        if location.get('id', False):   # Modifiy existing location
            location_id = location['id']
            del location['id']
            self.write(cr, uid, [location_id], location, context=context)
        else:
            location_id = self.create(cr, uid, location, context=context)

        return location_id

    @api.multi
    def write(self, vals):
        # self._test_image_small(vals)
        res = super(site_location_base, self).write(vals)
        return res

class site_location(model_with_sld):
    _name = 'component.location'
    _inherit = 'component.locationbase'

    def _component_count(self, cr, uid, ids, field_name, arg, context=None):
        res = dict.fromkeys(ids, 0)
        components = self.pool['component.component']
        for component in components.read_group(cr, uid, [('parent_model', '=', 'component.location'), ('parent_id', 'in', ids)],
                                          ['parent_id'], ['parent_id'], context):
            res[component['parent_id']] = components.search_count(cr,uid, [('parent_id', '=', component['parent_id'])], context=context)
        return res

    def open_location_view(self, cr, uid, ids, context=None):
        return {
            'type': 'ir.actions.act_window',
            'res_model': "component.location", # this model
            'res_id': ids[0], # the current wizard record
            'view_type': 'form',
            'view_mode': 'form,list',
            'target': 'current'}

    def _sublocation_count(self, cr, uid, ids, field_name, arg, context=None):
        res = dict.fromkeys(ids, 0)
        sublocations = self.pool['component.sublocation']
        for location in self.browse(cr, uid, ids, context):
            res[location.id] = sublocations.search_count(cr, uid, [('location_id',"=",location.id)], context);
        return res;

    _columns = {
        'site_id':      fields.many2one('component.site','Site', required=True),
        'sublocation_count': fields.function(_sublocation_count, string='Component count', type='integer'),
        'sublocation_ids':     fields.one2many('component.sublocation', 'location_id', 'Sub-locations', help='The list of sub-locations in this Location'),

        'component_ids': fields.one2many('component.component', 'parent_id', domain=[('parent_model', '=', 'component.location')], string='Devices'),
        'component_count': fields.function(_component_count, string='Component count', type='integer'),
    }

    def unlink(self, cr, uid, ids, context=None):
        if context is None:
            context = {}

        sublocations = self.pool['component.sublocation']
        sublocation_ids = sublocations.search(cr, uid, [('location_id', 'in', ids)], context=context)
        sublocations.unlink(cr, uid, sublocation_ids, context=context)

        devices = self.pool['component.component']
        device_ids = devices.search(cr, uid, [('parent_id', 'in', ids), ('parent_model', '=', 'component.location')], context=context)
        devices.unlink(cr, uid, device_ids, context=context)

        res = super(site_location, self).unlink(cr, uid, ids, context)
        return res

class site_sublocation(model_with_sld):
    _name = 'component.sublocation'
    _inherit = 'component.locationbase'

    def _component_count(self, cr, uid, ids, field_name, arg, context=None):
        res = dict.fromkeys(ids, 0)
        components = self.pool['component.component']
        for component in components.read_group(cr, uid, [('parent_model', '=', 'component.sublocation'), ('parent_id', 'in', ids)],
                                               ['parent_id'], ['parent_id'], context):
            res[component['parent_id']] = components.search_count(cr,uid, [('parent_id', '=', component['parent_id'])], context=context)
        return res

    _columns = {
        'location_id':      fields.many2one('component.location','Location', required=True),
        'component_ids': fields.one2many('component.component', 'parent_id', domain=[('parent_model', '=', 'component.sublocation')], string='Devices'),
        'component_count': fields.function(_component_count, string='Component count', type='integer'),
    }

    def open_location_view(self, cr, uid, ids, context=None):
        return {
            'type': 'ir.actions.act_window',
            'res_model': "component.sublocation", # this model
            'res_id': ids[0], # the current wizard record
            'view_type': 'form',
            'view_mode': 'form,list',
            'target': 'new'}

    def unlink(self, cr, uid, ids, context=None):
        if context is None:
            context = {}

        devices = self.pool['component.component']
        device_ids = devices.search(cr, uid, [('parent_id', 'in', ids), ('parent_model', '=', 'component.location')], context=context)
        devices.unlink(cr, uid, device_ids, context=context)

        res = super(site_sublocation, self).unlink(cr, uid, ids, context)
        return res
