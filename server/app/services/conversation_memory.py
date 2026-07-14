from datetime import datetime
from typing import List, Dict, Optional, Any


class ConversationMemory:
    def __init__(self, max_history: int = 30):
        self.sessions: Dict[str, List[Dict]] = {}
        self.max_history = max_history
        self._entity_cache: Dict[str, Dict[str, Any]] = {}

    def get_session(self, session_id: str) -> List[Dict]:
        if session_id not in self.sessions:
            self.sessions[session_id] = []
            self._entity_cache[session_id] = {}
        return self.sessions[session_id]

    def add_message(self, session_id: str, role: str, content: str,
                    metadata: Optional[Dict] = None,
                    entities: Optional[Dict] = None):
        session = self.get_session(session_id)
        entry = {
            'role': role,
            'content': content,
            'timestamp': datetime.utcnow().isoformat(),
            'metadata': metadata or {}
        }
        if entities:
            entry['entities'] = entities
            self._update_entity_cache(session_id, entities)
        session.append(entry)
        if len(session) > self.max_history:
            removed = session.pop(0)
            if removed.get('entities'):
                self._recompute_entity_cache(session_id)

    def _update_entity_cache(self, session_id: str, entities: Dict):
        cache = self._entity_cache.get(session_id, {})
        for key, value in entities.items():
            if value is not None:
                cache[key] = value
        self._entity_cache[session_id] = cache

    def _recompute_entity_cache(self, session_id: str):
        cache = {}
        session = self.get_session(session_id)
        for msg in session:
            ents = msg.get('entities', {})
            for key, value in ents.items():
                if value is not None:
                    cache[key] = value
        self._entity_cache[session_id] = cache

    def get_latest_entities(self, session_id: str) -> Dict[str, Any]:
        return self._entity_cache.get(session_id, {})

    def get_last_user_entities(self, session_id: str) -> Optional[Dict]:
        session = self.get_session(session_id)
        for msg in reversed(session):
            if msg['role'] == 'user' and msg.get('entities'):
                return msg['entities']
        return None

    def get_last_user_message(self, session_id: str) -> Optional[str]:
        session = self.get_session(session_id)
        for msg in reversed(session):
            if msg['role'] == 'user':
                return msg['content']
        return None

    def get_last_intent(self, session_id: str) -> Optional[str]:
        session = self.get_session(session_id)
        for msg in reversed(session):
            if msg['role'] == 'assistant':
                md = msg.get('metadata', {})
                if md.get('intent'):
                    return md['intent']
        return None

    def clear(self, session_id: str):
        self.sessions[session_id] = []
        self._entity_cache[session_id] = {}

    def get_context(self, session_id: str, last_n: int = 6) -> List[Dict]:
        session = self.get_session(session_id)
        return session[-last_n:] if session else []

    def get_last_assistant_data(self, session_id: str) -> Optional[Dict]:
        session = self.get_session(session_id)
        for msg in reversed(session):
            if msg['role'] == 'assistant' and msg.get('metadata', {}).get('data'):
                return msg['metadata']['data']
        return None

    def get_history(self, session_id: str) -> List[Dict]:
        return self.get_session(session_id)


memory = ConversationMemory()
