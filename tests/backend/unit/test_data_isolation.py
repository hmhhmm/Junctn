"""Unit tests — seeded data layer isolation (services/data.py)."""
import pytest

from backend.services.data import (
    get_advisor,
    get_client,
    get_clients_for_advisor,
    get_meetings_for_advisor,
    advisors,
    clients,
    meetings,
)


class TestAdvisorLookup:
    def test_get_advisor_returns_correct_record(self):
        adv = get_advisor("adv-1")
        assert adv is not None
        assert adv.id == "adv-1"
        assert adv.name == "Marcus Tan"

    def test_get_advisor_unknown_id_returns_none(self):
        assert get_advisor("adv-999") is None

    def test_all_six_advisors_exist(self):
        for i in range(1, 7):
            assert get_advisor(f"adv-{i}") is not None

    def test_advisors_have_unique_ids(self):
        ids = [a.id for a in advisors]
        assert len(ids) == len(set(ids))


class TestClientIsolation:
    def test_adv1_clients_are_only_adv1(self):
        clients = get_clients_for_advisor("adv-1")
        assert all(c.advisor_id == "adv-1" for c in clients)

    def test_adv2_clients_are_only_adv2(self):
        clients = get_clients_for_advisor("adv-2")
        assert all(c.advisor_id == "adv-2" for c in clients)

    def test_no_client_id_overlap_between_advisors(self):
        adv1_ids = {c.id for c in get_clients_for_advisor("adv-1")}
        adv2_ids = {c.id for c in get_clients_for_advisor("adv-2")}
        assert adv1_ids.isdisjoint(adv2_ids)

    def test_all_advisor_client_sets_are_disjoint(self):
        seen: set[str] = set()
        for i in range(1, 7):
            advisor_client_ids = {c.id for c in get_clients_for_advisor(f"adv-{i}")}
            assert seen.isdisjoint(advisor_client_ids), (
                f"adv-{i} shares client IDs with a previous advisor"
            )
            seen |= advisor_client_ids

    def test_unknown_advisor_returns_empty_list(self):
        assert get_clients_for_advisor("adv-999") == []

    def test_get_client_returns_correct_record(self):
        client = get_client("cli-1")
        assert client is not None
        assert client.id == "cli-1"
        assert client.advisor_id == "adv-1"

    def test_get_client_unknown_returns_none(self):
        assert get_client("cli-9999") is None

    def test_dormant_client_has_dormant_status(self):
        # cli-7 (Hafiz Ismail) is dormant in the seed data
        c = get_client("cli-7")
        assert c is not None
        assert c.status == "dormant"

    def test_clients_have_unique_ids(self):
        all_ids = [c.id for c in clients]
        assert len(all_ids) == len(set(all_ids))


class TestMeetingIsolation:
    def test_only_adv1_has_meetings(self):
        adv1_meetings = get_meetings_for_advisor("adv-1")
        assert len(adv1_meetings) == 5

    def test_adv2_has_no_meetings(self):
        assert get_meetings_for_advisor("adv-2") == []

    def test_meetings_belong_to_adv1(self):
        for m in get_meetings_for_advisor("adv-1"):
            assert m.advisor_id == "adv-1"

    def test_meetings_have_expected_structure(self):
        for m in get_meetings_for_advisor("adv-1"):
            assert m.id
            assert m.time
            assert m.title
            assert m.channel

    def test_unknown_advisor_has_no_meetings(self):
        assert get_meetings_for_advisor("adv-999") == []

    def test_adv1_meeting_client_ids_belong_to_adv1(self):
        adv1_client_ids = {c.id for c in get_clients_for_advisor("adv-1")}
        for m in get_meetings_for_advisor("adv-1"):
            if m.client_id:
                assert m.client_id in adv1_client_ids
