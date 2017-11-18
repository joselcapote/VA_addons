# -*- coding: utf-8 -*-
from openerp.osv import fields, osv

class lv_ac_cable_test(osv.osv):
    _name = 'component_test.lv_ac_cable_test'
    _inherits = {
        'component_test.order': 'delegated_id',
    }
    _description = 'LV AC Cable Test'

    _columns = {
        'delegated_id': fields.many2one('component_test.order', required=True, ondelete='cascade'),
        'component_id': fields.many2one('component.lv_ac_cable', required=True, string='Component inherited', readonly=True),

        # ********** Equipment Data. *************************
        # This is exactly a relation to all fields in
        # Component.electric_component_lv_ac_cable
        'from_node': fields.related('component_id', 'from_node', string='From<-', required=False),
        'to_node': fields.related('component_id', 'to_node', string='To->', required=False),
        'awg': fields.related('component_id', 'awg', string='AWG', required=False),
        'per_phase': fields.related('component_id', 'per_phase', string='Per Phase', required=False),

        # ********** Mechanical & Electrical Inspection*************************
        'Status1': fields.char('Status1', size=20, required=False),
        'Status2': fields.char('Status2', size=20, required=False),
        'Status3': fields.char('Status3', size=20, required=False),
        'Status4': fields.char('Status4', size=20, required=False),
        'Status5': fields.char('Status5', size=20, required=False),
        'Status6': fields.char('Status6', size=20, required=False),
        'Notes1': fields.char('Notes1', size=40, required=False),
        'Notes2': fields.char('Notes2', size=40, required=False),
        'Notes3': fields.char('Notes3', size=40, required=False),
        'Notes4': fields.char('Notes4', size=40, required=False),
        'Notes5': fields.char('Notes5', size=40, required=False),
        'Notes6': fields.char('Notes6', size=40, required=False),
        # ********** Insulation Resistance (MΩ) as per NETA Specifications*************************
        'PhtoPhAB': fields.float('PhtoPhAB', digits=0, required=False),
        'PhtoPhBA': fields.float('PhtoPhBA', digits=0, required=False),
        'PhtoPhCA': fields.float('PhtoPhCA', digits=0, required=False),
        'PhtoGroundA': fields.float('PhtoGroundA', digits=0, required=False),
        'PhtoGroundB': fields.float('PhtoGroundB', digits=0, required=False),
        'PhtoGroundC': fields.float('PhtoGroundC', digits=0, required=False),
        # ********** Notes & Comments*************************
        'Comments': fields.text('Comments', required=False),

    }
