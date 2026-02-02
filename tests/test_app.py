"""
Tests for the Mergington High School API
"""

import pytest
from fastapi.testclient import TestClient
import sys
from pathlib import Path

# Add src directory to path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from app import app, activities


@pytest.fixture
def client():
    """Create a test client"""
    return TestClient(app)


@pytest.fixture(autouse=True)
def reset_activities():
    """Reset activities data before each test"""
    activities.clear()
    activities.update({
        "Chess Club": {
            "description": "Learn strategies and compete in chess tournaments",
            "schedule": "Fridays, 3:30 PM - 5:00 PM",
            "max_participants": 12,
            "participants": ["michael@mergington.edu", "daniel@mergington.edu"]
        },
        "Programming Class": {
            "description": "Learn programming fundamentals and build software projects",
            "schedule": "Tuesdays and Thursdays, 3:30 PM - 4:30 PM",
            "max_participants": 20,
            "participants": ["emma@mergington.edu", "sophia@mergington.edu"]
        }
    })


def test_root_redirect(client):
    """Test that root redirects to index.html"""
    response = client.get("/", follow_redirects=False)
    assert response.status_code == 307
    assert response.headers["location"] == "/static/index.html"


def test_get_activities(client):
    """Test getting all activities"""
    response = client.get("/activities")
    assert response.status_code == 200
    data = response.json()
    assert "Chess Club" in data
    assert "Programming Class" in data
    assert data["Chess Club"]["max_participants"] == 12


def test_signup_for_activity(client):
    """Test signing up for an activity"""
    response = client.post(
        "/activities/Chess Club/signup?email=test@mergington.edu"
    )
    assert response.status_code == 200
    data = response.json()
    assert "Signed up test@mergington.edu for Chess Club" in data["message"]
    
    # Verify student was added
    activities_response = client.get("/activities")
    activities_data = activities_response.json()
    assert "test@mergington.edu" in activities_data["Chess Club"]["participants"]


def test_signup_duplicate_prevention(client):
    """Test that duplicate signups are prevented"""
    # First signup should succeed
    response = client.post(
        "/activities/Chess Club/signup?email=michael@mergington.edu"
    )
    assert response.status_code == 400
    data = response.json()
    assert "already signed up" in data["detail"].lower()


def test_signup_nonexistent_activity(client):
    """Test signing up for non-existent activity"""
    response = client.post(
        "/activities/NonExistent/signup?email=test@mergington.edu"
    )
    assert response.status_code == 404
    data = response.json()
    assert "Activity not found" in data["detail"]


def test_unregister_from_activity(client):
    """Test unregistering from an activity"""
    response = client.delete(
        "/activities/Chess Club/unregister?email=michael@mergington.edu"
    )
    assert response.status_code == 200
    data = response.json()
    assert "Unregistered michael@mergington.edu from Chess Club" in data["message"]
    
    # Verify student was removed
    activities_response = client.get("/activities")
    activities_data = activities_response.json()
    assert "michael@mergington.edu" not in activities_data["Chess Club"]["participants"]


def test_unregister_not_registered(client):
    """Test unregistering when not registered"""
    response = client.delete(
        "/activities/Chess Club/unregister?email=notregistered@mergington.edu"
    )
    assert response.status_code == 400
    data = response.json()
    assert "not registered" in data["detail"].lower()


def test_unregister_nonexistent_activity(client):
    """Test unregistering from non-existent activity"""
    response = client.delete(
        "/activities/NonExistent/unregister?email=test@mergington.edu"
    )
    assert response.status_code == 404
    data = response.json()
    assert "Activity not found" in data["detail"]
