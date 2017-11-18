# -*- coding: utf-8 -*-
from openerp.osv import fields, osv

class lv_cb_test(osv.osv):
    _name = 'component_test.lv_cb_test'
    _inherits = {
        'component_test.order': 'delegated_id',
    }
    _description = ''
    _columns = {
        'delegated_id': fields.many2one('component_test.order', required=True, ondelete='cascade'),

        'component_id': fields.many2one('component_test.lv_cb', 'Component', required=True, readonly=True),
    }
