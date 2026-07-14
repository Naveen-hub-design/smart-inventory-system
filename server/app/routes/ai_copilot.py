from flask import Blueprint, jsonify, request, session
from app.middleware.auth import staff_required, get_current_user
from app.services.conversation_memory import memory
from app.services.copilot_engine import copilot_engine
from app.models.audit_log import create_audit_log
from app.routes.settings import is_ai_feature_enabled
import uuid

copilot_bp = Blueprint('ai_copilot', __name__)


def _get_session_id():
    return request.json.get('session_id') if request.is_json else None


@copilot_bp.route('/copilot/chat', methods=['POST'])
@staff_required
def chat():
    if not is_ai_feature_enabled('ai_enabled'):
        return jsonify({'error': 'AI Assistant is disabled. Enable it in Settings.'}), 403
    user = get_current_user()
    data = request.get_json()
    if not data or not data.get('message'):
        return jsonify({'error': 'Message is required'}), 400

    message = data['message'].strip()
    session_id = data.get('session_id') or request.remote_addr or str(uuid.uuid4())

    try:
        result = copilot_engine.process_message(session_id, message, user)

        create_audit_log(
            username=user.username if user else 'system',
            role=user.role if user else 'system',
            action='copilot_chat',
            module='ai',
            description=f'Copilot query: {message[:100]} — Intent: {result.get("intent", "unknown")}'
        )

        response_data = {
            'session_id': session_id,
            'reply': result['message'],
            'suggestions': result['suggestions'],
            'intent': result['intent'],
            'can_export': result.get('can_export', False),
        }
        if result.get('navigate_to'):
            response_data['navigate_to'] = result['navigate_to']
        if result.get('report_type') and result.get('report_id'):
            response_data['report_type'] = result['report_type']
            response_data['report_id'] = result['report_id']
        return jsonify(response_data), 200

    except Exception as e:
        return jsonify({'error': f'Failed to process message: {str(e)}'}), 500


@copilot_bp.route('/copilot/history', methods=['GET'])
@staff_required
def get_history():
    if not is_ai_feature_enabled('ai_enabled'):
        return jsonify({'history': []}), 200
    session_id = request.args.get('session_id') or request.remote_addr or 'default'
    history = memory.get_history(session_id)
    return jsonify({'history': history}), 200


@copilot_bp.route('/copilot/clear', methods=['POST'])
@staff_required
def clear_history():
    if not is_ai_feature_enabled('ai_enabled'):
        return jsonify({'message': 'Conversation history cleared'}), 200
    session_id = _get_session_id() or request.remote_addr or 'default'
    memory.clear(session_id)
    return jsonify({'message': 'Conversation history cleared'}), 200


@copilot_bp.route('/copilot/export', methods=['POST'])
@staff_required
def export_conversation():
    if not is_ai_feature_enabled('ai_enabled'):
        return jsonify({'error': 'AI Assistant is disabled.'}), 403
    session_id = _get_session_id() or request.remote_addr or 'default'
    history = memory.get_history(session_id)
    lines = ['AI ERP Copilot — Conversation Export', f'Exported: {__import__("datetime").datetime.utcnow().isoformat()}', '']
    for msg in history:
        role = 'You' if msg['role'] == 'user' else 'AI Copilot'
        lines.append(f'[{msg["timestamp"][:19]}] {role}:')
        lines.append(msg['content'])
        lines.append('')
    return '\n'.join(lines), 200, {'Content-Type': 'text/plain; charset=utf-8'}
