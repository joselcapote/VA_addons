{
    'name': 'Component plane',
    'version': '1.0',
    'summary': 'Components plane',
    'description': """
Openerp Component site plane view.
=========================

""",
    'version': '2.0',
    'depends': ['web'],
    'data' : [
        'views/component_plane_templates.xml',
    ],
    'qweb': [
        "static/src/xml/*.xml",
    ],
    'auto_install': True,
}
