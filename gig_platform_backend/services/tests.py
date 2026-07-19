from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import UserProfile, WorkerProfile

from .models import ServiceCategory, ServiceRequest


class ServiceRequestCustomerCancelTests(APITestCase):
	def setUp(self):
		self.user_model = get_user_model()
		self.category = ServiceCategory.objects.create(
			name="Plumbing",
			slug="plumbing",
		)

		self.customer = self.user_model.objects.create_user(
			email="customer@example.com",
			username="customer",
			password="testpass123",
			first_name="Customer",
			last_name="User",
			phone_number="+15550000001",
		)
		UserProfile.objects.create(user=self.customer)

		self.worker_user = self.user_model.objects.create_user(
			email="worker@example.com",
			username="worker",
			password="testpass123",
			first_name="Worker",
			last_name="User",
			phone_number="+15550000002",
			user_type=self.user_model.Choice.WORKER,
		)
		self.worker_profile = WorkerProfile.objects.create(
			worker=self.worker_user,
			verification_status=WorkerProfile.VERIFICATION_STATUS.VERIFIED,
			availability_status=WorkerProfile.AVAILABILITY_STATUS.ACTIVE,
		)

	def _create_request(self, status_value):
		return ServiceRequest.objects.create(
			requester=self.customer,
			category=self.category,
			title="Fix sink",
			description="Kitchen sink leak",
			request_latitude=10.0,
			request_longitude=20.0,
			request_address="123 Main St",
			search_radius_km=10,
			status=status_value,
			assigned_worker=self.worker_profile,
		)

	def test_customer_can_cancel_matching_request_before_acceptance(self):
		service_request = self._create_request(ServiceRequest.Status.MATCHING)
		self.client.force_authenticate(user=self.customer)

		response = self.client.post(
			reverse("service_request_customer_cancel", kwargs={"request_id": service_request.id}),
			{"reason": "No longer needed."},
			format="json",
		)

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		service_request.refresh_from_db()
		self.assertEqual(service_request.status, ServiceRequest.Status.CANCELLED)
		self.assertEqual(service_request.cancellation_reason, "No longer needed.")

	def test_customer_cannot_cancel_after_worker_accepts(self):
		service_request = self._create_request(ServiceRequest.Status.ASSIGNED)
		self.client.force_authenticate(user=self.customer)

		response = self.client.post(
			reverse("service_request_customer_cancel", kwargs={"request_id": service_request.id}),
			{"reason": "Too late."},
			format="json",
		)

		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
		self.assertIn("before a worker accepts", response.data["detail"])
		service_request.refresh_from_db()
		self.assertEqual(service_request.status, ServiceRequest.Status.ASSIGNED)
