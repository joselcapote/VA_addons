# -*- coding: utf-8 -*-
import logging

from openerp import api
from openerp import tools
from openerp.osv import fields, osv
from openerp.models import BaseModel

_logger = logging.getLogger(__name__)

class electric_component_base(osv.osv):

    def get_record_as_default(self, cr, uid, components, component):
        field_keys = components.fields_get_keys(cr, uid, context=None)
        field_values = component.fields_get(field_keys, write_access=True)
        default_dict = {}
        for key in field_keys:
            if key in field_values:
                field_value = field_values[key]
                type =''
                if ('type' in field_value):
                    type =field_value['type']

                if ((component[key] != False) & (type != 'binary')):
                    default_dict['default_'+key] = str(component[key])
        return default_dict

    def get_current_employee(self, cr, uid, context=None):
        employee = self.pool['hr.employee']
        domain = [('user_id', '=', uid)]
        employees = []
        for rec in employee.browse(cr, uid, employee.search(cr, uid, domain, context=context), context=context):
            employees.append(rec.id)
        return employees

    def action_get_test_tree_view(self, cr, uid, ids, context=None):
        ctx = dict()
        for component in self.browse(cr, uid, ids, context=context):
            if component.component_model_test in self.pool:
                if 'delegated_id' in component:
                    def_id = component.id
                    ctx = self.get_record_as_default(cr, uid, self, component)
                else:
                    true_components = self.pool[component.component_model]
                    # def_id = true_components.search(cr, uid, [('delegated_id', '=', component.id)], limit=1)
                    # for true_component in true_components.browse(cr, uid, [('id', '=', def_id[0])], context=context):
                    #     ctx = self.get_record_as_default(cr, uid, true_components, true_component)

                    domain = [('delegated_id', '=', component.id)]
                    for rec in true_components.browse(cr, uid, true_components.search(cr, uid, domain, context=context), context=context):
                        def_id = rec.id
                        ctx = self.get_record_as_default(cr, uid, true_components, rec)

                ctx.update({
                    'default_component_id': def_id,
                    'default_technician': self.get_current_employee(cr, uid)
                })
                return {
                    'name': ('New test'),
                    'view_type': 'form',
                    'view_mode': 'list,form',
                    'res_model': component.component_model_test,
                    'context': ctx,
                    'domain': str([('component_id', '=', def_id)]),
                    'type': 'ir.actions.act_window',
                    'target': 'current'
                }

    def open_component_view(self, cr, uid, ids, context=None):
        for component in self.browse(cr, uid, ids, context=context):
            if 'delegated_id' in component:
                def_id = component.id
            else:
                true_components = self.pool[component.component_model]
                def_id = true_components.search(cr, uid, [('delegated_id', '=', component.id)], limit=1)[0]
            return {
                'type': 'ir.actions.act_window',
                'res_model': component.component_model, # this model
                'res_id': def_id, # the current wizard record
                'view_type': 'form',
                'view_mode': 'form',
                'target': 'new'}

    def test_avaliable(self):
        # Aqui se pregunta por uno de los modelos que estarán en el tese,
        # pudiera ser cualquiera
        return 'component_test.dry_transformer_test' in self.pool;

    @api.multi
    def action_get_attachment_tree_view(self):
        attachment_action = self.env.ref('base.action_attachment')
        action = attachment_action.read()[0]
        action['context'] = {'default_res_model': "component.component", 'default_res_id': self.ids[0]}
        action['domain'] = str(['&', ('res_model', '=', "component.component"), ('res_id', 'in', self.ids)])
        return action

    def action_get_component_form_view(self, cr, uid, ids, context=None):
        for component in self.browse(cr, uid, ids, context):
            electric_component = self.pool.get(component.component_model)
            for electric in electric_component.browse(cr, uid, ids, context=context):
                return electric_component.get_formview_action(cr, uid, electric.id, context)

    def electric_info(self, cr, uid, ids, field_name, arg, context=None):
        res = dict.fromkeys(ids, "")
        for component in self.browse(cr, uid, ids, context=context):
            if 'delegated_id' in component:
                res[component.id] = component.electric_info
            else:
                true_components = self.pool[component.component_model]
                domain = [('delegated_id', '=', component.id)]
                for rec in true_components.browse(cr, uid, true_components.search(cr, uid, domain, context=context), context=context):
                    res[component.id] = rec.component_info
        return res

    def get_formview_action(self, cr, uid, id, context=None):
        context = context or {}
        component = self.browse(cr, uid, id, {'limit': 1})
        electric_component = self.pool.get(component.component_model)
        return super(osv.osv, electric_component).get_formview_action(cr, uid, id, context=context)

    def _test_image_small(self, vals):
        if 'image_small' not in vals:
            if ('image' in vals):
                vals['image_small'] = tools.image_resize_image_small(vals.get('image'), avoid_if_small=True)
            else:
                if ('image_medium' in vals):
                    vals['image_small'] = tools.image_resize_image_small(vals.get('image_medium'), avoid_if_small=True)
        return vals

    def remove_component(self, cr, uid, ids, arg, context=None):
        return False

class ElectricComponent(electric_component_base):
    _inherit = 'component.component'
    _description = 'Components'

    def electric_info(self, cr, uid, ids, field_name, arg, context=None):
        return super(ElectricComponent, self).electric_info(cr, uid, ids, field_name, arg, context=context)

    # def _electric_info(self, cr, uid, ids, field_name, arg, context=None):
    #     res = dict.fromkeys(ids, "")
    #     for component in self.browse(cr, uid, ids, context=context):
    #         cmodel = self.pool[component.component_model]
    #         for c in cmodel.browse(cr, uid, [('delegated_id' in ids)], context=context):
    #             if 'component_info' in c:
    #                 res[c.delegated_id] = c.component_info;
    #     return res;

    def _get_attachment_number(self, cr, uid, ids, field_name, arg, context=None):
        res = dict.fromkeys(ids, 0)
        return res

    def _test_count(self, cr, uid, ids, field_name, arg, context=None):
        res = dict.fromkeys(ids, 0)
        for component in self.browse(cr, uid, ids, context=context):
            if component.component_model_test in self.pool:
                if 'delegated_id' in component:
                    def_id = component.id
                else:
                    true_components = self.pool[component.component_model]
                    def_id = true_components.search(cr, uid, [('delegated_id', '=', component.id)], limit=1)
                count = self.pool[component.component_model_test].search_count(cr, uid, [('component_id',"=",def_id)], context);
                res[component.id] = count
        return res

    def _get_attachment_number(self, cr, uid, ids, field_name, arg, context=None):
        res = dict.fromkeys(ids, 0)
        component_docs = self.pool['ir.attachment']
        for docs in component_docs.read_group(cr, uid, [('res_model', '=', 'component.component'), ('res_id', 'in', ids)],
                                          ['res_id'], ['res_id'], context):
            res[docs['res_id']] = component_docs.search_count(cr,uid, [('res_id', '=', docs['res_id'])], context=context)
        return res

    def fields_view_get(self, cr, uid, view_id=None, view_type='form', context=None, toolbar=False, submenu=False):
        result = super(ElectricComponent, self).fields_view_get(cr, uid, view_id, view_type, context, toolbar, submenu)
        return result

    _columns = {
        'electric_info': fields.function(electric_info, 'Information', type='char'),
        'customer_id': fields.many2one('res.partner', 'Customer'),
        'component_model': fields.char('Component Model'),
        'component_model_test': fields.char('Component Model Test'),
        'test_count': fields.function(_test_count, string='Test Sheets', type='integer'),
        'attachment_number': fields.function(_get_attachment_number, string="Documents Attached", type="integer"),
        'attachment_ids': fields.one2many('ir.attachment', 'res_id', domain=[('res_model', '=', 'component.component')], string='Attachments')
    }

    @api.model
    def create(self, values):
        # values = self._test_image_small(values)
        return super(ElectricComponent, self).create(values)

    @api.multi
    def write(self, vals):
        # self._test_image_small(vals)
        res = super(ElectricComponent, self).write(vals)
        return res

    def can_create(self):
        return self.electric_component_type != 'all_components'

    _defaults = {
        'electric_component_type': 'all_components',
    }

    def unlink(self, cr, uid, ids, context=None):
        for component in self.browse(cr, uid, ids, context=context):
            if not('delegated_id' in component):
                true_components = self.pool[component.component_model]
                def_id = true_components.search(cr, uid, [('delegated_id', '=', component.id)], limit=1)
                self.pool[component.component_model].unlink(cr, uid, def_id, context=context)
        return super(ElectricComponent, self).unlink(cr, uid, ids, context)