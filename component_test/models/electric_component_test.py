import time

from openerp.osv import fields, osv
from openerp import api

class test_order(osv.osv):
    _name = 'component_test.order'
    _description = 'Test Order'

    STATE_SELECTION = [
        ('draft', 'DRAFT'),
        ('released', 'WAITING PARTS'),
        ('ready', 'READY TO MAINTENANCE'),
        ('done', 'DONE'),
        ('cancel', 'CANCELED')
    ]

    # def _get_component_name(self, cr, uid, ids, field_name, arg, context=None):
    #     res = dict.fromkeys(ids, '')
    #     component_model = self.pool['component.component']
    #     for component in component_model.browse(cr, uid, [('id','in',ids)], context=context):
    #         res[component.id] = component.name
    #     return res

    _columns = {
        'component_model': fields.char('Component Model', readonly=True, help="The database object this attachment \n\ "
                                                                              "will be attached to"),

        # ********* Component Information ****************************************
        'base_component_id': fields.many2one('component.component', required=False, string='Component', readonly=True),
        'component_image': fields.related('base_component_id', 'image_medium', type='binary', readonly=True),
        'component_name': fields.related('base_component_id', 'name', type='char', string='Component Name', readonly=True),

        'Customer': fields.related('base_component_id', 'customer_id', string='Customer', relation='res.partner',
                                   type='many2one', readonly=True),
        'site_id': fields.related('base_component_id', 'site_id', string='Site', relation='component.site', type='many2one',
                                  readonly=True),
        'place_id': fields.related('base_component_id', 'place_id', string='Place', relation='component.place', type='many2one',
                                  readonly=True),
        'electric_component_type': fields.related('base_component_id', 'electric_component_type',
                                                  string='Electric Component Type', type='char', readonly=True),
        'Manufacturer': fields.related('base_component_id', 'manufacturer', string="Manufacturer", type='char',readonly=True),

        # ********** General ***************************************
        'technician': fields.many2one('hr.employee', string='Technician', size=64, translate=True, required=False, readonly=True),
        'job_number': fields.char('Job number', size=64, translate=True, required=True),
        'date_execution': fields.datetime('Execution Date', required=True),
        'company_id': fields.many2one('res.company', string='Company', readonly=True, required=True,
                                      default=lambda self: self.env.user.company_id),
        'company_logo': fields.related('company_id', 'logo', readonly=True, type='binary'),
        'company_name': fields.related('company_id', 'name', readonly=True, type='char'),

        'state': fields.selection(STATE_SELECTION, 'Status', readonly=True,
                                  help="When the maintenance order is created the status is set to 'Draft'.\n\
            If the order is confirmed the status is set to 'Waiting Parts'.\n\
            If the stock is available then the status is set to 'Ready to Maintenance'.\n\
            When the maintenance is over, the status is set to 'Done'."),
    }
    _defaults = {
        'date_execution': lambda *a: time.strftime('%Y-%m-%d %H:%M:%S'),
        'state': lambda *a: 'done',
    }

    @api.model
    @api.returns('self', lambda value: value.id)
    def create(self, vals):
        cr, uid, context = self.env.args
        if 'default_component_model_test' in context:
            cid = context['default_component_id']
            for c in self.pool[context['default_component_model']].browse(cr, uid, [cid], context=context):
                vals['base_component_id'] = c['delegated_id'].id
        return super(test_order, self).create(vals)
