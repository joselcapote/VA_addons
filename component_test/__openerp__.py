# -*- coding: utf-8 -*-
##############################################################################
#
#    OpenERP, Open Source Management Solution
#    Copyright (C) 2013-2015 CodUP (<http://codup.com>).
#
#    This program is free software: you can redistribute it and/or modify
#    it under the terms of the GNU Affero General Public License as
#    published by the Free Software Foundation, either version 3 of the
#    License, or (at your option) any later version.
#
#    This program is distributed in the hope that it will be useful,
#    but WITHOUT ANY WARRANTY; without even the implied warranty of
#    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#    GNU Affero General Public License for more details.
#
#    You should have received a copy of the GNU Affero General Public License
#    along with this program.  If not, see <http://www.gnu.org/licenses/>.
#
##############################################################################

{
    'name': 'Component Test',
    'version': '1.0',
    'summary': 'Component Testing',
    'description': """
Testing Electric Component
=====================================

Component Testing and record of Test sheets.

Required modules:
    * component
    """,
    'author': 'VoltusAutomation, KRKA',
    'website': 'http://www.voltusautomation.com/component_test',
    'category': 'Enterprise Component Management',
    'sequence': 0,
    'depends': [
                'component',
                'document',
                'hr'
                ],
    'demo': [],
    'data': [
        'security/component_test_security.xml',
        'security/ir.model.access.csv',
        # 'views/report_test_order.xml',
        'views/view_testsheets.xml',
        'views/view_drytransformer_test.xml',
        'views/view_lvaccable_test.xml',
        'views/lv_cb.xml',
        'views/swr.xml',
        # 'reports/report_drytransformer.xml'
    ],
    'application': True,
    'installable': True,
}
# vim:expandtab:smartindent:tabstop=4:softtabstop=4:shiftwidth=4: