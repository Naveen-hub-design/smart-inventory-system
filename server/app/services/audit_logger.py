from app.models.audit_log import create_audit_log
from app import db


def log_action(user, module, action, description, status='success'):
    if not user:
        create_audit_log(
            username='system',
            role='system',
            action=action,
            module=module,
            description=description,
            status=status
        )
        db.session.commit()
        return

    create_audit_log(
        username=user.username,
        role=user.role,
        action=action,
        module=module,
        description=description,
        status=status,
        user_id=user.id
    )
    db.session.commit()