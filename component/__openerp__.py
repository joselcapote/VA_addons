# -*- coding: utf-8 -*-

{
    'name': 'Component',
    'version': '1.9',
    'summary': 'Components Management',
    'description': """
Managing Components in Odoo.
===========================
Support following feature:
    * Location for Component
    * Assign Component to employee
    * Track warranty information
    * Custom states of Component
    * States of Component for different team: Finance, Warehouse, Manufacture, Maintenance and Accounting
    * Drag&Drop manage states of Component
    * Component Tags
    * Search by main fields
    """,
    'author': 'Voltus Automation',
    'website': 'http://www.voltusautomation.com',
    'category': 'Enterprise Component Management',
    'sequence': 0,
    'images': ['images/component.png'],
    'depends': [
                'mail',
                'web',
                'component_explorer',
                'component_plane',
                ],

    'demo': ['component_demo.xml'],
    'data': [
        'security/component_security.xml',
        'security/ir.model.access.csv',
        'views/component_explorer.xml',
        'views/component_plane.xml',
        'views/component_view.xml',
        'views/component_view_lv_ac_cable.xml',
        'views/component_view_lv_cb.xml',
        'views/component_view_swr.xml',
        'views/component_view_dry_transformer.xml',
        'views/component_site_templates.xml',
        'component_data.xml',
        'views/site_view.xml',
        'views/component.xml',
        'views/project_view.xml',
    ],
    'installable': True,
    'application': True,
}
# vim:expandtab:smartindent:tabstop=4:softtabstop=4:shiftwidth=4: