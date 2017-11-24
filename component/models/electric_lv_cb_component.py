# -*- coding: utf-8 -*-
from openerp import api
from electric_component import electric_component_base
from openerp.osv import fields, osv

ASSET_TYPE = 'lv_cb'
ASSET_MODEL = 'component.lv_cb_component'
ASSET_MODEL_TEST = 'component_test.lv_cb_test'

class CBComponent(electric_component_base):

    _name = ASSET_MODEL
    _inherits = {
        'component.component': 'delegated_id',
    }

    def _component_info(self, cr, uid, ids, field_name, arg, context=None):
        res = dict.fromkeys(ids, "")
        for rec in self.browse(cr, uid, ids, context):
            value = 'Voltage=' + str(rec.voltage) + ' ,'
            value = value + 'Current=' + str(rec.current)
            res[ids[0]] = value
            return res

    _columns = {
        'delegated_id': fields.many2one('component.component', required=True, ondelete='cascade'),
        'voltage': fields.integer('Voltage', required=False),
        'current': fields.integer('Current', required=False),
        'component_info': fields.function(_component_info, 'Information', type='char'),
    }

    @api.model
    def create(self, values):
        if not values.get('electric_component_type') and 'electric_component_type' not in self._context:
            values['electric_component_type'] = ASSET_TYPE
            values['component_model'] = ASSET_MODEL
            values['component_model_test'] = ASSET_MODEL_TEST
        return super(CBComponent, self).create(values)



