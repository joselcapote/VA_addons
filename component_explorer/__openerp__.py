{
    'name': 'Component explorer',
    'version': '1.9',
    'summary': 'Components explorer',
    'description': """
Openerp Component Explorer view.
=========================

""",
    'version': '2.0',
    'depends': ['web_kanban'],
    'data' : [
        'views/component_explorer_templates.xml',
    ],
    'qweb': [
        "static/src/xml/*.xml",
    ],
    'auto_install': True,
}
