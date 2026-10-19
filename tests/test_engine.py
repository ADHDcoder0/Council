"""Unit tests for Council debate engine logic."""

from __future__ import annotations

from council.engine import Engine
from council.models import CouncilConfig, TranscriptEntry


class TestRoundRobinOrder:
    def test_active_members_excludes_chair(self, default_config: CouncilConfig):
        engine = Engine(default_config)
        active = engine.active_members()
        assert len(active) == 3
        assert all(not m.chair for m in active)
        assert [m.name for m in active] == ["Skeptic", "Builder", "Visionary"]

    def test_round_robin_execution_order(self, default_config: CouncilConfig, fake_complete):
        engine = Engine(default_config)
        engine.add_user_message("Topic question")

        spoken: list[str] = []
        engine.run_round(on_result=lambda m, text: spoken.append(m.name))

        assert spoken == ["Skeptic", "Builder", "Visionary"]
        assert len(engine.transcript) == 4  # 1 user + 3 members

    def test_multiple_rounds_order(self, default_config: CouncilConfig, fake_complete):
        engine = Engine(default_config)
        engine.add_user_message("Topic question")

        spoken: list[str] = []
        engine.run_round(on_result=lambda m, text: spoken.append(m.name))
        engine.run_round(on_result=lambda m, text: spoken.append(m.name))

        assert spoken == [
            "Skeptic",
            "Builder",
            "Visionary",
            "Skeptic",
            "Builder",
            "Visionary",
        ]


class TestChairBehavior:
    def test_chair_excluded_from_standard_rounds(self, default_config: CouncilConfig, fake_complete):
        engine = Engine(default_config)
        engine.add_user_message("Topic")

        spoken: list[str] = []
        engine.run_round(on_result=lambda m, text: spoken.append(m.name))
        assert "Chair" not in spoken

    def test_chair_speaks_only_on_explicit_call(self, default_config: CouncilConfig, fake_complete):
        engine = Engine(default_config)
        engine.add_user_message("Topic")
        engine.run_round()

        chair_spoken: list[str] = []
        engine.run_chair(on_result=lambda m, text: chair_spoken.append(m.name))

        assert chair_spoken == ["Chair"]
        assert engine.transcript[-1].kind == "chair"
        assert engine.transcript[-1].speaker == "Chair"


class TestWindowTrimming:
    def test_window_trims_prompt_to_recent_entries(self, default_config: CouncilConfig):
        default_config.window = 3
        engine = Engine(default_config)

        for i in range(10):
            engine.transcript.append(
                TranscriptEntry(speaker="You" if i % 2 == 0 else "Member", kind="user", text=f"Message {i}")
            )

        member = default_config.members[0]
        prompt = engine.build_user_prompt(member)

        # Only the last 3 messages (7, 8, 9) should be present
        assert "Message 7" in prompt
        assert "Message 8" in prompt
        assert "Message 9" in prompt
        assert "Message 0" not in prompt
        assert "Message 6" not in prompt


class TestMuteBehavior:
    def test_muted_member_is_skipped(self, default_config: CouncilConfig, fake_complete):
        # Mute Skeptic
        default_config.members[0].muted = True
        engine = Engine(default_config)
        engine.add_user_message("Topic")

        spoken: list[str] = []
        engine.run_round(on_result=lambda m, text: spoken.append(m.name))

        assert "Skeptic" not in spoken
        assert spoken == ["Builder", "Visionary"]

    def test_unmuting_restores_member(self, default_config: CouncilConfig, fake_complete):
        default_config.members[0].muted = True
        engine = Engine(default_config)
        engine.add_user_message("Topic")

        spoken: list[str] = []
        engine.run_round(on_result=lambda m, text: spoken.append(m.name))
        assert spoken == ["Builder", "Visionary"]

        # Unmute Skeptic
        default_config.members[0].muted = False
        spoken.clear()
        engine.run_round(on_result=lambda m, text: spoken.append(m.name))
        assert spoken == ["Skeptic", "Builder", "Visionary"]


class TestErrorContinues:
    def test_error_on_one_member_continues_to_next(
        self, default_config: CouncilConfig, failing_skeptic_complete
    ):
        engine = Engine(default_config)
        engine.add_user_message("Topic")

        successful: list[str] = []
        errors: list[str] = []

        engine.run_round(
            on_result=lambda m, text: successful.append(m.name),
            on_error=lambda m, err: errors.append(m.name),
        )

        assert errors == ["Skeptic"]
        assert successful == ["Builder", "Visionary"]
        # Transcript should contain user + the 2 successful members
        assert len(engine.transcript) == 3
