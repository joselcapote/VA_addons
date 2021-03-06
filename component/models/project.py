from openerp import api
from openerp.osv import fields, osv
from openerp import tools

class model_with_image(osv.osv):
    _name = 'component.imaged'
    _description = 'Model with image'

    def _get_image(self, cr, uid, ids, name, args, context=None):
        result = dict.fromkeys(ids, False)
        for obj in self.browse(cr, uid, ids, context=context):
            result[obj.id] = tools.image_get_resized_images(obj.image, avoid_resize_medium=True)
        return result

    def _set_image(self, cr, uid, id, name, value, args, context=None):
        return self.write(cr, uid, [id], {'image': tools.image_resize_image_big(value)}, context=context)

    _columns = {
        'image': fields.binary("Image",
                               help="This field holds the image used as image for the asset, limited to 1024x1024px."),
        'image_medium': fields.function(_get_image, fnct_inv=_set_image,
                                        string="Medium-sized image", type="binary", multi="_get_image",
                                        store={
                                            'component.imaged': (lambda self, cr, uid, ids, c={}: ids, ['image'], 10),
                                        },
                                        help="Medium-sized image of the asset. It is automatically " \
                                             "resized as a 128x128px image, with aspect ratio preserved, " \
                                             "only when the image exceeds one of those sizes. Use this field in form views or some kanban views."),
        'image_small': fields.function(_get_image, fnct_inv=_set_image,
                                       string="Small-sized image", type="binary", multi="_get_image",
                                       store={
                                           'component.imaged': (lambda self, cr, uid, ids, c={}: ids, ['image'], 10),
                                       },
                                       help="Small-sized image of the asset. It is automatically " \
                                            "resized as a 64x64px image, with aspect ratio preserved. " \
                                            "Use this field anywhere a small image is required."),
    }


class Component_project(model_with_image):
    _name = 'component.project'
    _description = 'Component Projects'
    _inherit = "component.imaged"

    @api.multi
    def action_get_attachment_tree_view(self):
        attachment_action = self.env.ref('base.action_attachment')
        action = attachment_action.read()[0]
        action['context'] = {'default_res_model': "component.project", 'default_res_id': self.ids[0]}
        action['domain'] = str(['&', ('res_model', '=', "component.project"), ('res_id', 'in', self.ids)])
        return action

    def _get_attachment_number(self, cr, uid, ids, field_name, arg, context=None):
        res = dict.fromkeys(ids, 0)
        component_docs = self.pool['ir.attachment']
        for docs in component_docs.read_group(cr, uid, [('res_model', '=', 'component.project'), ('res_id', 'in', ids)],
                                              ['res_id'], ['res_id'], context):
            res[docs['res_id']] = component_docs.search_count(cr,uid, [('res_id', '=', docs['res_id'])], context=context)
        return res

    def _site_count(self, cr, uid, ids, field_name, arg, context=None):
        res = dict.fromkeys(ids, 0)
        sites = self.pool['component.site']
        for project in self.browse(cr, uid, ids, context):
            res[project.id] = sites.search_count(cr, uid, [('project_id',"=",project.id)], context);
        return res;

    _columns = {
        'name': fields.char('Project Name', size=64, required=True),
        'abstract': fields.char('Project abstract', size=256, required=False),

        'company_id':  fields.many2one('res.company', 'Client'),
        'company_contacts': fields.many2one('res.partner', 'company_Contact',domain=[('company_type','=','person')]),
        'krka_contacts': fields.many2one('res.partner', 'krka_Contact',domain=[('company_type','=','person')]),

        'krkacontacts': fields.many2many('res.users', 'krka_contacts', 'id', 'partner_id', string='krkacontacts'),
        'procontacts': fields.many2many('res.users', 'project_contacts', 'id', 'partner_id', string='procontacts'),

        'contract_no': fields.char('Contract Nummber', size=64),
        'scope_of_work': fields.text('Scope of work', size=256, required=False, translate=False),
        'site_ids':        fields.one2many('component.site', 'id', 'Sites', help='The list of project sites'),
        'site_count':   fields.function(_site_count, string='Site count', type='integer'),
        'attachment_number': fields.function(_get_attachment_number, string="Documents Attached", type="integer"),
        'attachment_ids': fields.one2many('ir.attachment', 'res_id', domain=[('res_model', '=', 'component.component')], string='Attachments'),
    }

    def open_project_view(self, cr, uid, ids, context=None):
        return {
            'type': 'ir.actions.act_window',
            'res_model': "component.project", # this model
            'res_id': ids[0], # the current wizard record
            'view_type': 'form',
            'view_mode': 'form,list',
            'target': 'new'}

    def action_get_sites_kanban_view(self, cr, uid, ids, context=None):
        ctx = dict()
        for project in self.browse(cr, uid, ids, context):
            ctx.update({
                'default_project_id': project.id,
            })
            return {
                'name': ('New project'),
                'view_type': 'kanban',
                'view_mode': 'kanban,list',
                'res_model': 'component.project',
                'context': ctx,
                'domain': str([('project_id', '=', project.id)]),
                'type': 'ir.actions.act_window',
            }

    @api.model
    def create(self, vals):
        res = super(Component_project, self).create(vals)
        return res

    @api.multi
    def write(self, vals):
        res = super(Component_project, self).write(vals)
        return res

    def unlink(self, cr, uid, ids, context=None):
        if context is None:
            context = {}
        sites = self.pool['component.site']
        site_ids = sites.search(cr, uid, [('project_id', 'in', ids)], context=context)
        sites.unlink(cr, uid, site_ids, context=context)

        res = super(Component_project, self).unlink(cr, uid, ids, context)
        return res
