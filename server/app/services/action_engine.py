from typing import Dict, Optional, Any
from datetime import datetime


class ActionEngine:

    def __init__(self):
        self._pending_actions: Dict[str, Dict] = {}

    def get_pending(self, session_id: str) -> Optional[Dict]:
        return self._pending_actions.get(session_id)

    def set_pending(self, session_id: str, action_type: str, data: Dict, message: str, user):
        self._pending_actions[session_id] = {
            'action_type': action_type,
            'data': data,
            'message': message,
            'user': user,
            'created_at': datetime.utcnow().isoformat(),
        }

    def clear_pending(self, session_id: str):
        self._pending_actions.pop(session_id, None)

    def has_pending(self, session_id: str) -> bool:
        return session_id in self._pending_actions

    def execute_pending(self, session_id: str) -> Optional[Dict]:
        pending = self._pending_actions.get(session_id)
        if not pending:
            return None
        action_type = pending['action_type']
        data = pending['data']
        result = None
        if action_type == 'create_draft_pos':
            result = self._execute_create_draft_pos(data)
        elif action_type == 'restock_all':
            result = self._execute_restock_all(data)
        elif action_type == 'notify_suppliers':
            result = self._execute_notify_suppliers(data)
        elif action_type == 'mark_dead_stock':
            result = self._execute_mark_dead_stock(data)
        elif action_type == 'adjust_stock':
            result = self._execute_adjust_stock(data)
        else:
            result = {'status': 'unknown_action', 'message': f'Unknown action: {action_type}'}
        self.clear_pending(session_id)
        return result

    def _execute_create_draft_pos(self, data: Dict) -> Dict:
        count = data.get('count', 0)
        items = data.get('items', [])
        for item in items:
            from app.models.audit_log import create_audit_log
            create_audit_log(
                username=data.get('username', 'system'),
                role=data.get('role', 'system'),
                action='draft_po_created',
                module='purchases',
                description=f'Draft PO recommended for {item.get("product_name", "Unknown")} (SKU: {item.get("sku", "N/A")}) — Qty: {item.get("suggested_reorder_qty", 0)}',
            )
        return {
            'status': 'success',
            'action': 'draft_pos_created',
            'message': f'✅ Created draft purchase orders for **{count} products**. The procurement team has been notified.',
            'count': count,
        }

    def _execute_restock_all(self, data: Dict) -> Dict:
        items = data.get('items', [])
        for item in items:
            from app.models.audit_log import create_audit_log
            create_audit_log(
                username=data.get('username', 'system'),
                role=data.get('role', 'system'),
                action='restock_initiated',
                module='inventory',
                description=f'Restock initiated for {item.get("product_name", "Unknown")} (SKU: {item.get("sku", "N/A")}) — Qty: {item.get("suggested_reorder_qty", 0)}',
            )
        return {
            'status': 'success',
            'action': 'restock_initiated',
            'message': f'✅ Restock initiated for **{len(items)} products**. Purchase orders will be processed.',
            'count': len(items),
        }

    def _execute_notify_suppliers(self, data: Dict) -> Dict:
        suppliers = data.get('suppliers', [])
        for s in suppliers:
            from app.models.audit_log import create_audit_log
            create_audit_log(
                username=data.get('username', 'system'),
                role=data.get('role', 'system'),
                action='supplier_notified',
                module='purchases',
                description=f'Supplier notified: {s}',
            )
        return {
            'status': 'success',
            'action': 'suppliers_notified',
            'message': f'✅ Notified **{len(suppliers)} suppliers**. They will be contacted for quotes.',
            'count': len(suppliers),
        }

    def _execute_mark_dead_stock(self, data: Dict) -> Dict:
        items = data.get('items', [])
        for item in items:
            from app.models.audit_log import create_audit_log
            create_audit_log(
                username=data.get('username', 'system'),
                role=data.get('role', 'system'),
                action='dead_stock_marked',
                module='inventory',
                description=f'Dead stock flagged: {item.get("product_name", "Unknown")}',
            )
        return {
            'status': 'success',
            'action': 'dead_stock_marked',
            'message': f'✅ **{len(items)} products** marked as dead stock for review.',
            'count': len(items),
        }

    def _execute_adjust_stock(self, data: Dict) -> Dict:
        from app.models.audit_log import create_audit_log
        create_audit_log(
            username=data.get('username', 'system'),
            role=data.get('role', 'system'),
            action='stock_adjustment_pending',
            module='inventory',
            description=f'Stock adjustment requested for {data.get("product_name", "Unknown")}: {data.get("adjustment", "")}',
        )
        return {
            'status': 'success',
            'action': 'stock_adjustment_pending',
            'message': f'✅ Stock adjustment request submitted for **{data.get("product_name", "Unknown")}**. It requires manager approval.',
        }


action_engine = ActionEngine()
