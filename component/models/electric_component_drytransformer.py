# -*- coding: utf-8 -*-
from openerp import api
from electric_component import electric_component_base
from openerp.osv import fields, osv

ASSET_TYPE = 'dry_transformer'
ASSET_MODEL = 'component.dry_transformer'
ASSET_MODEL_TEST = 'component_test.dry_transformer_test'

class ElectricComponentDryTransformer(electric_component_base):
    _name = ASSET_MODEL

    _inherits = {
        'component.component': 'delegated_id',
    }

    # def _component_info(self, cr, uid, ids, field_name, arg, context=None):
    #     res = dict.fromkeys(ids, "")
    #     for component in self.browse(cr, uid, ids, context=context):
    #         value = 'Site=' + component.site_id.name + ' ,'
    #         value = value + 'Place=' + component.site_id.name
    #         res[component.id] = value
    #     return res;

    def _component_info(self, cr, uid, ids, field_name, arg, context=None):
        res = dict.fromkeys(ids, "")
        for rec in self.browse(cr, uid, ids, context):
            value = 'HV=' + str(rec.HV) + ' ,'
            value = value +'LV=' + str(rec.LV) + ' ,'
            value = value +'PowerRating=' + str(rec.PowerRating) + ' ,'
            res[ids[0]] = value
            return res

    _columns = {
        'delegated_id': fields.many2one('component.component', required=True, ondelete='cascade'),

        # ************* Equipment Data. Specific fields of Dry Transformers ***************
        'PowerRating': fields.float('PowerRating', digits=0, required=False),
        'HV': fields.float('HV', digits=0, required=False),
        'LV': fields.float('LV', digits=0, required=False),
        'Frequency': fields.float('Frequency', digits=0, required=False),
        'Serial': fields.char('Serial', size=20, required=False),
        'Type': fields.char('Type', size=20, required=False),

        'MFGDate': fields.date('MFGDate', required=False),
        'Phase': fields.char('Phase', size=20, required=False),
        'Tap': fields.char('Tap', size=20, required=False),
        'TCooling': fields.char('TCooling', size=20, required=False),
        'Impedance': fields.float('Impedance', digits=0, required=False),
        'ImpTemp': fields.float('ImpTemp', digits=0, required=False),
        'TempRise': fields.float('TempRise', digits=0, required=False),
        'WindingConf': fields.char('WindingConf', size=20, required=False),
        'Style': fields.char('Style', size=20, required=False),
        'component_info': fields.function(_component_info, 'Information', type='char'),
    }

    @api.model
    def create(self, values):
        if not values.get('electric_component_type') and 'electric_component_type' not in self._context:
            values['electric_component_type'] = ASSET_TYPE
            values['component_model'] = ASSET_MODEL
            values['component_model_test'] = ASSET_MODEL_TEST
        return super(ElectricComponentDryTransformer, self).create(values)

