# -*- coding: utf-8 -*-
from openerp import api
from openerp.osv import fields, osv


class testsheets_dry_transformer(osv.osv):
    _name = 'component_test.dry_transformer_test'
    _inherits = {'component_test.order': 'delegated_id'}

    _description = 'Dry transformer'
    _columns = {
        'delegated_id': fields.many2one('component_test.order', required=True, ondelete='cascade'),
        'component_id': fields.many2one('component.dry_transformer', required=True, string='Component inherited', readonly=True),
        # 'component_delegated_id': fields.related('component_id', 'delegated_id', type='integer', readonly=True, store=True),
        # ********** Equipment Data. *************************
        # This is exactly a relation to all fields in
        # Component.electric_component_drytransformer
        'HV': fields.related('component_id', 'HV', string='HV', type='float', readonly=True),
        'LV': fields.related('component_id', 'LV', string='LV', type='float', readonly=True),
        'PowerRating': fields.related('component_id', 'PowerRating', string='PowerRating', type='float', readonly=True),
        'Frequency': fields.related('component_id', 'Frequency', string='Frequency', type='float', readonly=True),
        'Serial': fields.related('component_id', 'Serial', string='Serial', type='char', readonly=True),
        'Type': fields.related('component_id', 'Type', string='Type', type='char', readonly=True),

        'MFGDate': fields.related('component_id', 'MFGDate', string='MFGDate', type='date', readonly=True),
        'Phase': fields.related('component_id', 'Phase', string='Phase', type='char', readonly=True),
        'Tap': fields.related('component_id', 'Tap', string='Tap', type='char', readonly=True),
        'TCooling': fields.related('component_id', 'TCooling', string='TCooling', type='char', readonly=True),
        'Impedance': fields.related('component_id', 'Impedance', string='Impedance', type='float', readonly=True),
        'ImpTemp': fields.related('component_id', 'ImpTemp', string='ImpTemp', type='float', readonly=True),
        'TempRise': fields.related('component_id', 'TempRise', string='TempRise', type='float', readonly=True),
        'WindingConf': fields.related('component_id', 'WindingConf', string='WindingConf', type='char', readonly=True),
        'Style': fields.related('component_id', 'Style', string='Style', type='char', readonly=True),

        # ********** Mechanical & Electrical Inspection*************************
        # Here the specific data of the Test
        'Status1': fields.char('Status1', size=20, required=False),
        'Status2': fields.char('Status2', size=20, required=False),
        'Status3': fields.char('Status3', size=20, required=False),
        'Status4': fields.char('Status4', size=20, required=False),
        'Status5': fields.char('Status5', size=20, required=False),
        'Status6': fields.char('Status6', size=20, required=False),
        'Status7': fields.char('Status7', size=20, required=False),
        'Status8': fields.char('Status8', size=20, required=False),
        'Status9': fields.char('Status9', size=20, required=False),
        'Status10': fields.char('Status10', size=20, required=False),
        'Status11': fields.char('Status11', size=20, required=False),
        'Status12': fields.char('Status12', size=20, required=False),
        'Notes1': fields.char('Notes1', size=40, required=False),
        'Notes2': fields.char('Notes2', size=40, required=False),
        'Notes3': fields.char('Notes3', size=40, required=False),
        'Notes4': fields.char('Notes4', size=40, required=False),
        'Notes5': fields.char('Notes5', size=40, required=False),
        'Notes6': fields.char('Notes6', size=40, required=False),
        'Notes7': fields.char('Notes7', size=40, required=False),
        'Notes8': fields.char('Notes8', size=40, required=False),
        'Notes9': fields.char('Notes9', size=40, required=False),
        'Notes10': fields.char('Notes10', size=40, required=False),
        'Notes11': fields.char('Notes11', size=40, required=False),
        'Notes12': fields.char('Notes12', size=40, required=False),
        # ********** Transformer Turn Ratio Test*************************
        'TapP1': fields.char('TapP1', size=40, required=False),
        'TapP2': fields.char('TapP2', size=40, required=False),
        'TapP3': fields.char('TapP3', size=40, required=False),
        'TapP4': fields.char('TapP4', size=40, required=False),
        'TapP5': fields.char('TapP5', size=40, required=False),
        'PriV1': fields.float('PriV1', digits=0, required=False),
        'PriV2': fields.float('PriV2', digits=0, required=False),
        'PriV3': fields.float('PriV3', digits=0, required=False),
        'PriV4': fields.float('PriV4', digits=0, required=False),
        'PriV5': fields.float('PriV5', digits=0, required=False),
        'SecV1': fields.float('SecV1', digits=0, required=False),
        'SecV2': fields.float('SecV2', digits=0, required=False),
        'SecV3': fields.float('SecV3', digits=0, required=False),
        'SecV4': fields.float('SecV4', digits=0, required=False),
        'SecV5': fields.float('SecV5', digits=0, required=False),
        'CalcRatio1': fields.float('CalcRatio1', digits=0, required=False),
        'CalcRatio2': fields.float('CalcRatio2', digits=0, required=False),
        'CalcRatio3': fields.float('CalcRatio3', digits=0, required=False),
        'CalcRatio4': fields.float('CalcRatio4', digits=0, required=False),
        'CalcRatio5': fields.float('CalcRatio5', digits=0, required=False),
        'H3H1R1': fields.float('H3H1R1', digits=0, required=False),
        'H3H1R2': fields.float('H3H1R2', digits=0, required=False),
        'H3H1R3': fields.float('H3H1R3', digits=0, required=False),
        'H3H1R4': fields.float('H3H1R4', digits=0, required=False),
        'H3H1R5': fields.float('H3H1R5', digits=0, required=False),
        'H3H1mA1': fields.float('H3H1mA1', digits=0, required=False),
        'H3H1mA2': fields.float('H3H1mA2', digits=0, required=False),
        'H3H1mA3': fields.float('H3H1mA3', digits=0, required=False),
        'H3H1mA4': fields.float('H3H1mA4', digits=0, required=False),
        'H3H1mA5': fields.float('H3H1mA5', digits=0, required=False),
        'H1H2R1': fields.float('H1H2R1', digits=0, required=False),
        'H1H2R2': fields.float('H1H2R2', digits=0, required=False),
        'H1H2R3': fields.float('H1H2R3', digits=0, required=False),
        'H1H2R4': fields.float('H1H2R4', digits=0, required=False),
        'H1H2R5': fields.float('H1H2R5', digits=0, required=False),
        'H1H2mA1': fields.float('H1H2mA1', digits=0, required=False),
        'H1H2mA2': fields.float('H1H2mA2', digits=0, required=False),
        'H1H2mA3': fields.float('H1H2mA3', digits=0, required=False),
        'H1H2mA4': fields.float('H1H2mA4', digits=0, required=False),
        'H1H2mA5': fields.float('H1H2mA5', digits=0, required=False),
        'H2H3R1': fields.float('H2H3R1', digits=0, required=False),
        'H2H3R2': fields.float('H2H3R2', digits=0, required=False),
        'H2H3R3': fields.float('H2H3R3', digits=0, required=False),
        'H2H3R4': fields.float('H2H3R4', digits=0, required=False),
        'H2H3R5': fields.float('H2H3R5', digits=0, required=False),
        'H2H3mA1': fields.float('H2H3mA1', digits=0, required=False),
        'H2H3mA2': fields.float('H2H3mA2', digits=0, required=False),
        'H2H3mA3': fields.float('H2H3mA3', digits=0, required=False),
        'H2H3mA4': fields.float('H2H3mA4', digits=0, required=False),
        'H2H3mA5': fields.float('H2H3mA5', digits=0, required=False),
        # ********** Transformer Surge Arrestor*************************
        'TSAManufacturer': fields.char('TSAManufacturer', size=50, required=False),
        'CatalogNo': fields.char('CatalogNo', size=20, required=False),
        'MCOVRating': fields.char('MCOVRating', size=20, required=False),
        # **********Insulation Resistance (MΩ) (5000 VDC for 1-Minute)*************************
        'PhtoGroundA': fields.float('PhtoGroundA', digits=0, required=False),
        'PhtoGroundB': fields.float('PhtoGroundB', digits=0, required=False),
        'PhtoGroundC': fields.float('PhtoGroundC', digits=0, required=False),
        # ********** Insulation Resistance (MΩ) as per NETA Specifications*************************
        'TestV1': fields.char('TestV1', size=20, required=False),
        'TestV2': fields.char('TestV2', size=20, required=False),
        'TestV3': fields.char('TestV3', size=20, required=False),
        'TestV4': fields.char('TestV4', size=20, required=False),
        'TestV5': fields.char('TestV5', size=20, required=False),
        'Measureat': fields.float('Measureat', digits=0, required=False),
        'Reportat': fields.float('Reportat', digits=0, required=False),
        'Measured1': fields.char('Measured1', size=20, required=False),
        'Measured2': fields.char('Measured2', size=20, required=False),
        'Measured3': fields.char('Measured3', size=20, required=False),
        'Measured4': fields.char('Measured4', size=20, required=False),
        'Measured5': fields.char('Measured5', size=20, required=False),
        'Reported1': fields.char('Reported1', size=20, required=False),
        'Reported2': fields.char('Reported2', size=20, required=False),
        'Reported3': fields.char('Reported3', size=20, required=False),
        'Reported4': fields.char('Reported4', size=20, required=False),
        'Reported5': fields.char('Reported5', size=20, required=False),
        # ********** Primary Winding Resistance*************************
        'H1H2Current': fields.char('H1H2Current', size=20, required=False),
        'H2H3Current': fields.char('H2H3Current', size=20, required=False),
        'H3H1Current': fields.char('H3H1Current', size=20, required=False),
        'H1H2Duration': fields.char('H1H2Duration', size=20, required=False),
        'H2H3Duration': fields.char('H2H3Duration', size=20, required=False),
        'H3H1Duration': fields.char('H3H1Duration', size=20, required=False),
        'H1H2Resistance': fields.char('H1H2Resistance', size=20, required=False),
        'H2H3Resistance': fields.char('H2H3Resistance', size=20, required=False),
        'H3H1Resistance': fields.char('H3H1Resistance', size=20, required=False),
        # ********** Secondary Winding Resistance*************************
        'X0X1Current': fields.char('X0X1Current', size=20, required=False),
        'X0X2Current': fields.char('X0X2Current', size=20, required=False),
        'X0X3Current': fields.char('X0X3Current', size=20, required=False),
        'X0X1Duration': fields.char('X0X1Duration', size=20, required=False),
        'X0X2Duration': fields.char('X0X2Duration', size=20, required=False),
        'X0X3Duration': fields.char('X0X3Duration', size=20, required=False),
        'X0X1Resistance': fields.char('X0X1Resistance', size=20, required=False),
        'X0X2Resistance': fields.char('X0X2Resistance', size=20, required=False),
        'X0X3Resistance': fields.char('X0X3Resistance', size=20, required=False),
        'X1X2Current': fields.char('X1X2Current', size=20, required=False),
        'X2X3Current': fields.char('X2X3Current', size=20, required=False),
        'X3X1Current': fields.char('X3X1Current', size=20, required=False),
        'X1X2Duration': fields.char('X1X2Duration', size=20, required=False),
        'X2X3Duration': fields.char('X2X3Duration', size=20, required=False),
        'X3X1Duration': fields.char('X3X1Duration', size=20, required=False),
        'X1X2Resistance': fields.char('X1X2Resistance', size=20, required=False),
        'X2X3Resistance': fields.char('X2X3Resistance', size=20, required=False),
        'X3X1Resistance': fields.char('X3X1Resistance', size=20, required=False),
        # **********Dissipation Factor & Insulation Capacitance*************************
        'DisFactor1': fields.char('DisFactor1', size=20, required=False),
        'DisFactor2': fields.char('DisFactor2', size=20, required=False),
        'DisFactor3': fields.char('DisFactor3', size=20, required=False),
        'DisFactor4': fields.char('DisFactor4', size=20, required=False),
        'DisFactor5': fields.char('DisFactor5', size=20, required=False),
        'CapReading1': fields.char('CapReading1', size=20, required=False),
        'CapReading2': fields.char('CapReading2', size=20, required=False),
        'CapReading3': fields.char('CapReading3', size=20, required=False),
        'CapReading4': fields.char('CapReading4', size=20, required=False),
        'CapReading5': fields.char('CapReading5', size=20, required=False),
        'Capacitance1': fields.char('Capacitance1', size=20, required=False),
        'Capacitance2': fields.char('Capacitance2', size=20, required=False),
        'Capacitance3': fields.char('Capacitance3', size=20, required=False),
        'Capacitance4': fields.char('Capacitance4', size=20, required=False),
        'Capacitance5': fields.char('Capacitance5', size=20, required=False),
        # ********** Notes & Comments*************************
        'Comments': fields.text('Comments', required=False),

    }

    @api.multi
    def write(self, vals):
        # if 'delegated_id' in vals:
        #     vals['component_id'] = vals['delegated_id']
        res = super(testsheets_dry_transformer, self).write(vals)
        return res

    @api.model
    @api.returns('self', lambda value: value.id)
    def create(self, vals):
        # self = self.with_context(alias_model_name='hr.equipment.request', alias_parent_model_name=self._name)
        return super(testsheets_dry_transformer, self).create(vals)
        # category_id.alias_id.write({'alias_parent_thread_id': category_id.id, 'alias_defaults': {'category_id': category_id.id}})
        # return category_id