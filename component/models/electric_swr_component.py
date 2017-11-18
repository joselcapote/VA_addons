# -*- coding: utf-8 -*-
from openerp import api
from electric_component import electric_component_base
from openerp.osv import fields, osv

ASSET_TYPE = 'swr'
ASSET_MODEL = 'component.swr_component'
ASSET_MODEL_TEST = 'component_test.swr_component_test'

class ElectricSWRComponent(electric_component_base):

    _name = ASSET_MODEL
    _inherits = {
        'component.component': 'delegated_id',
    }

    def _component_info(self, cr, uid, ids, field_name, arg, context=None):
        res = dict.fromkeys(ids, "")
        for rec in self.browse(cr, uid, ids, context):
            value = 'Bus rating='+str(rec.bus_rating)+' ,'
            value = value+'Bus size='+str(rec.bus_size)
            res[ids[0]] = value
            return res

    _columns = {
        'delegated_id': fields.many2one('component.component', required=True, ondelete='cascade'),
        'from_component_id': fields.many2one('component.component', 'From', required=False),
        'to_component_id':  fields.many2one('component.component', 'To', required=False),
        'bus_rating': fields.integer('Bus Rating', required=False),
        'bus_size': fields.char('Bus size', required=False),
        'component_info': fields.function(_component_info, 'Information', type='char'),
    }

    @api.model
    def create(self, values):
        if not values.get('electric_component_type') and 'electric_component_type' not in self._context:
            values['electric_component_type'] = ASSET_TYPE
            values['component_model'] = ASSET_MODEL
            values['component_model_test'] = ASSET_MODEL_TEST
        return super(ElectricSWRComponent, self).create(values)

    def action_get_test_tree_view(self, cr, uid, ids, context=None):
        return self.pool.get('component.component').action_get_test_tree_view(cr, uid, ids, context)
