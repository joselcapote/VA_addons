# -*- coding: utf-8 -*-
from openerp import api
from electric_component import electric_component_base
from openerp.osv import fields, osv

ASSET_TYPE = 'lv_ac_cable'
ASSET_MODEL = 'component.lv_ac_cable'
ASSET_MODEL_TEST = 'component_test.lv_ac_cable_test'

class ElectricCableComponent(electric_component_base):

    _name = ASSET_MODEL
    _inherits = {
        'component.component': 'delegated_id',
    }

    def _component_info(self, cr, uid, ids, field_name, arg, context=None):
        res = dict.fromkeys(ids, "")
        for rec in self.browse(cr, uid, ids, context):
            value = 'AWG=' + str(rec.awg) + ' ,'
            value = value + 'Per phase=' + str(rec.per_phase)
            res[ids[0]] = value
            return res

    _columns = {
        'delegated_id': fields.many2one('component.component', required=True, ondelete='cascade'),

        # ************* Equipment Data. Specific fields of Dry Transformers ***************
        'from_node': fields.char('From<--', size=50, required=False),
        'to_node': fields.char('To-->', size=50, required=False),
        'awg': fields.float('AWG', digits=0, required=False),
        'per_phase': fields.integer('Per phase', required=False),
        'component_info': fields.function(_component_info, 'Information', type='char'),
    }

    @api.model
    def create(self, values):
        if not values.get('electric_component_type') and 'electric_component_type' not in self._context:
            values['electric_component_type'] = ASSET_TYPE
            values['component_model'] = ASSET_MODEL
            values['component_model_test'] = ASSET_MODEL_TEST
        return super(ElectricCableComponent, self).create(values)

