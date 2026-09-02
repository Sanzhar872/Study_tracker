from pydantic_settings import BaseSettings, PydanticBaseSettingsSource


class Settings(BaseSettings):
    database_url: str = "postgresql://postgres:postgres@localhost:5432/study_tracker"
    cors_origins: list[str] = ["http://localhost:5173"]
    secret_key: str = "dev-secret-change-me"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 30

    class Config:
        env_file = ".env"

    @classmethod
    def settings_customise_sources(
        cls,
        settings_cls,
        init_settings: PydanticBaseSettingsSource,
        env_settings: PydanticBaseSettingsSource,
        dotenv_settings: PydanticBaseSettingsSource,
        file_secret_settings: PydanticBaseSettingsSource,
    ):
        # This project's backend/.env must win over stray OS environment
        # variables (e.g. a DATABASE_URL left over from another project in
        # the same shell) — pydantic-settings otherwise prioritises real
        # env vars over the .env file, which is the opposite of what we want
        # for a project-local config file.
        return init_settings, dotenv_settings, env_settings, file_secret_settings


settings = Settings()
