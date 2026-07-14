from abc import ABC, abstractmethod
from typing import Optional, Dict, Any, List


class LLMProvider(ABC):
    @abstractmethod
    def generate(self, prompt: str, context: Optional[List[Dict]] = None) -> str:
        pass

    @abstractmethod
    def name(self) -> str:
        pass


class GeminiProvider(LLMProvider):
    def generate(self, prompt: str, context: Optional[List[Dict]] = None) -> str:
        raise NotImplementedError("Gemini provider not yet configured")

    def name(self) -> str:
        return "gemini"


class OpenAIProvider(LLMProvider):
    def generate(self, prompt: str, context: Optional[List[Dict]] = None) -> str:
        raise NotImplementedError("OpenAI provider not yet configured")

    def name(self) -> str:
        return "openai"


class AzureOpenAIProvider(LLMProvider):
    def generate(self, prompt: str, context: Optional[List[Dict]] = None) -> str:
        raise NotImplementedError("Azure OpenAI provider not yet configured")

    def name(self) -> str:
        return "azure_openai"


class OllamaProvider(LLMProvider):
    def generate(self, prompt: str, context: Optional[List[Dict]] = None) -> str:
        raise NotImplementedError("Ollama provider not yet configured")

    def name(self) -> str:
        return "ollama"


class ProviderFactory:
    _providers: Dict[str, type] = {}

    @classmethod
    def register(cls, name: str, provider_cls: type):
        cls._providers[name] = provider_cls

    @classmethod
    def create(cls, name: str, **kwargs) -> LLMProvider:
        if name not in cls._providers:
            raise ValueError(f"Unknown LLM provider: {name}")
        return cls._providers[name](**kwargs)

    @classmethod
    def list_providers(cls) -> List[str]:
        return list(cls._providers.keys())


ProviderFactory.register('gemini', GeminiProvider)
ProviderFactory.register('openai', OpenAIProvider)
ProviderFactory.register('azure_openai', AzureOpenAIProvider)
ProviderFactory.register('ollama', OllamaProvider)
