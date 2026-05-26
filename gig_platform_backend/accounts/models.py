import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import RegexValidator
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError
from django.db.models import Q


# Create your models here.
class CustomUser(AbstractUser):
    """
    CustomUser model extending Django's AbstractUser.
    A custom user model that provides authentication and user management with additional
    fields for gig worker backend application. Supports multiple user types (User, Worker, Admin)
    and includes phone number validation, profile pictures, and email/phone verification tracking.
    Attributes:
        - id (UUIDField): Primary key using UUID4 for unique identification.
        - email (EmailField): Unique email address for user authentication.
        - phone_number (CharField): Unique phone number with international format validation.
        - user_type (CharField): Classification of user role (User, Worker, or Admin).
        - profile_picture (ImageField): Optional user profile image stored in 'profile_pictures/' directory.
    Username Field:
        Uses 'email' as the primary username field for authentication instead of default username.
    Ordering:
        Results are ordered by most recently joined users first.
    Methods:
        __str__(): Returns email and user type display for readable string representation.
    """

    class Choice(models.TextChoices):
        USER = "User"
        WORKER = "Worker"
        ADMIN = "Admin"

    phone_regex = RegexValidator(
        regex=r"^\+?1?\d{9,15}$", message="Phone: '+999999999'. Up to 15 digits."
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    phone_number = models.CharField(
        validators=[phone_regex],
        max_length=17,
        unique=True,
    )
    user_type = models.CharField(
        max_length=10,
        choices=Choice.choices,
        default=Choice.USER,
    )
    profile_picture = models.ImageField(
        upload_to="profile_pictures/",
        null=True,
        blank=True,
    )
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username", "first_name", "last_name", "phone_number"]

    class Meta:
        ordering = ["-date_joined"]

    def __str__(self):
        return f"{self.email} ({self.get_user_type_display()})"


class UserProfile(models.Model):
    """
    UserProfile model that stores extended user information and location-based preferences.
    This model maintains a one-to-one relationship with CustomUser and tracks:
    - User's current geographic location (latitude, longitude, and address)
    - User's preferred search radius for gig opportunities
    - Timestamps for record creation and modification
    Attributes:
        - user (OneToOneField): Reference to the associated CustomUser instance
        - current_latitude (DecimalField): User's current latitude coordinate (nullable)
        - current_longitude (DecimalField): User's current longitude coordinate (nullable)
        - current_address (TextField): User's current address as text (nullable)
        - preferred_radius_km (DecimalField): Preferred search radius in kilometers,
            constrained between 0.2 and 20.0 km (default: 5.0)
        - created_at (DateTimeField): Timestamp when the profile was created
        - updated_at (DateTimeField): Timestamp when the profile was last modified
    """

    user = models.OneToOneField(
        CustomUser,
        on_delete=models.CASCADE,
        related_name="user_profile",
    )
    current_latitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
        db_index=True,
    )
    current_longitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
        db_index=True,
    )
    current_address = models.TextField(blank=True, null=True)

    preferred_radius_km = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=5.00,
        validators=[MinValueValidator(0.2), MaxValueValidator(20.00)],
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Profile of {self.user.get_full_name()} "


class SavedLocation(models.Model):
    """
    SavedLocation model that stores user-defined saved locations.
    This model maintains a many-to-one relationship with UserProfile and tracks:
    - Label for the saved location (e.g., "Home", "Work")
    - Type of location (Home, Work, Other)
    - Geographic coordinates (latitude, longitude)
    - Address of the saved location
    - Default status (whether this is the user's default location)
    - Timestamps for record creation
    Attributes:
        - id (UUIDField): Unique identifier for each saved location
        - user_profile (ForeignKey): Reference to the associated UserProfile instance
        - label (CharField): Label for the saved location
        - location_type (CharField): Type of location (Home, Work, Other)
        - latitude (DecimalField): Latitude coordinate of the saved location
        - longitude (DecimalField): Longitude coordinate of the saved location
        - address (TextField): Address of the saved location
        - is_default (BooleanField): Whether this is the user's default location
        - created_at (DateTimeField): Timestamp when the saved location was created
    """

    class LocationType(models.TextChoices):
        HOME = "Home"
        WORK = "Work"
        OTHER = "Other"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_profile = models.ForeignKey(
        UserProfile,
        on_delete=models.CASCADE,
        related_name="saved_locations",
    )
    label = models.CharField(max_length=50)
    location_type = models.CharField(
        max_length=10,
        choices=LocationType.choices,
        default=LocationType.HOME,
    )
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    address = models.TextField()
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [["user_profile", "label"]]
        constraints = [
            models.UniqueConstraint(
                fields=["user_profile"],
                condition=Q(is_default=True),
                name="unique_default_location_per_user",
            )
        ]

    def __str__(self):
        return f"{self.label} ({self.user_profile.user.get_full_name()})"


class WorkerProfile(models.Model):
    """
    WorkerProfile Model
    Represents a worker's profile in the gig worker platform, storing worker-specific information
    such as verification status, availability, services offered, ratings, and service area details.
    Attributes:
        - worker (OneToOneField): Reference to the CustomUser who owns this profile.
        - verification_status (CharField): Current verification status of the worker.
            Choices: PENDING, VERIFIED, REJECTED. Default: PENDING.
        - verified_at (DateTimeField): Timestamp when the worker was verified. Null if not yet verified.
        - verified_by (ForeignKey): Reference to the admin/moderator who verified the worker.
            Can be null if not yet verified or if verifier was deleted.
        - rejection_reason (TextField): Reason for rejection if verification_status is REJECTED.
        - availability_status (CharField): Current availability status of the worker.
            Choices: ACTIVE, INACTIVE, BUSY. Default: INACTIVE.
        - service_category (CharField): Primary service category offered by the worker.
            Choices: PLUMBER, ELECTRICIAN, CLEANER, CARPENTER.
        - skills (TextField): Comma-separated or detailed list of skills the worker possesses.
        - bio (TextField): Professional biography/description of the worker (max 500 characters).
        - hourly_rate (DecimalField): Hourly rate charged by the worker in currency units.
        - service_latitude (DecimalField): Latitude coordinate of the worker's primary service location.
        - service_longitude (DecimalField): Longitude coordinate of the worker's primary service location.
        - service_radius_km (DecimalField): Radius in kilometers within which the worker provides services.
            Default: 10.00 km.
        - average_rating (DecimalField): Average rating based on completed jobs (scale: 0.00-5.00).
            Default: 0.00.
        - total_reviews (PositiveIntegerField): Number of reviews received from customers. Default: 0.
        - total_jobs_completed (PositiveIntegerField): Total number of successfully completed jobs. Default: 0.
        - created_at (DateTimeField): Timestamp when the profile was created (auto-set).
        - updated_at (DateTimeField): Timestamp when the profile was last updated (auto-updated).
    """

    class VERIFICATION_STATUS(models.TextChoices):
        PENDING = "Pending"
        VERIFIED = "Verified"
        REJECTED = "Rejected"

    class AVAILABILITY_STATUS(models.TextChoices):
        ACTIVE = "Active"
        INACTIVE = "Inactive"
        BUSY = "Busy"

    worker = models.OneToOneField(
        CustomUser,
        on_delete=models.CASCADE,
        related_name="worker_profile",
    )
    verification_status = models.CharField(
        max_length=10,
        choices=VERIFICATION_STATUS.choices,
        default=VERIFICATION_STATUS.PENDING,
        db_index=True,
    )
    verified_at = models.DateTimeField(null=True, blank=True)
    verified_by = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="verified_workers",
    )
    rejection_reason = models.TextField(blank=True, null=True)
    availability_status = models.CharField(
        max_length=10,
        choices=AVAILABILITY_STATUS.choices,
        default=AVAILABILITY_STATUS.INACTIVE,
        db_index=True,
    )

    # Category values are sourced from services.ServiceCategory records.
    service_category = models.CharField(max_length=80, default="Plumber", db_index=True)
    skills = models.TextField(blank=True, null=True)
    bio = models.TextField(max_length=500, blank=True, null=True)
    hourly_rate = models.DecimalField(
        max_digits=6, decimal_places=2, null=True, blank=True
    )
    service_latitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True, db_index=True
    )
    service_longitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True, db_index=True
    )
    service_radius_km = models.DecimalField(
        max_digits=5, decimal_places=2, default=10.00
    )
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    total_reviews = models.PositiveIntegerField(default=0)
    total_jobs_completed = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["verification_status", "availability_status"]),
            models.Index(fields=["service_category", "availability_status"]),
            models.Index(fields=["average_rating"]),
            models.Index(fields=["created_at"]),
        ]

    @property
    def is_recommendation_ready(self):
        if self.verification_status != self.VERIFICATION_STATUS.VERIFIED:
            return False
        if self.availability_status != self.AVAILABILITY_STATUS.ACTIVE:
            return False
        return self.documents.filter(
            verification_status=WorkerDocument.VERIFICATION_STATUS.VERIFIED
        ).exists()

    def clean(self):
        active_statuses = ["ASSIGNED", "ARRIVING", "IN_PROGRESS"]
        has_active_job = False
        if not self._state.adding:
            has_active_job = self.assigned_requests.filter(
                status__in=active_statuses
            ).exists()

        if has_active_job and self.availability_status != self.AVAILABILITY_STATUS.BUSY:
            raise ValidationError(
                {
                    "availability_status": (
                        "Worker is busy with an active job. Complete or cancel it before changing availability."
                    )
                }
            )

        if (
            self.availability_status == self.AVAILABILITY_STATUS.ACTIVE
            and self.verification_status != self.VERIFICATION_STATUS.VERIFIED
        ):
            raise ValidationError(
                {
                    "availability_status": (
                        "Worker must be verified before becoming active."
                    )
                }
            )

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.worker.get_full_name()} - {self.service_category}"


class WorkerDocument(models.Model):
    """
    WorkerDocument Model
    This model represents identity and verification documents submitted by gig workers.
    It stores document information, verification status, and audit trails for worker verification.
    Attributes:
        - id (UUIDField): Unique identifier for the document record.
        - worker_profile (ForeignKey): Reference to the WorkerProfile that owns this document.
        - document_type (CharField): Type of document (Citizenship, Driver's License, NIN Card).
        - document_number (CharField): The identification number from the document.
        - document_file (FileField): Uploaded document file stored in 'worker_documents/' directory.
        - verification_status (CharField): Current verification state (Pending, Verified, Rejected).
        - verified_at (DateTimeField): Timestamp when document was verified.
        - verified_by (ForeignKey): Reference to the CustomUser who verified the document.
        - rejection_reason (TextField): Reason for rejection if document was rejected.
        - uploaded_at (DateTimeField): Timestamp when document was uploaded.
    Meta:
        Enforces unique constraint on (worker_profile, document_type, document_number) combination
        to prevent duplicate document submissions of the same type from the same worker.
    Methods:
        __str__(): Returns a human-readable string representation showing document type and worker name.
    """

    class DocumentType(models.TextChoices):
        CITIZENSHIP = "Citizenship"
        DRIVER_LICENSE = "Driver's License"
        NIN_CARD = "NIN Card"

    class VERIFICATION_STATUS(models.TextChoices):
        PENDING = "Pending"
        VERIFIED = "Verified"
        REJECTED = "Rejected"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    worker_profile = models.ForeignKey(
        WorkerProfile, on_delete=models.CASCADE, related_name="documents"
    )

    document_type = models.CharField(max_length=20, choices=DocumentType.choices)
    document_number = models.CharField(max_length=100, db_index=True)
    document_file = models.FileField(upload_to="worker_documents/")

    verification_status = models.CharField(
        max_length=20,
        choices=VERIFICATION_STATUS.choices,
        default=VERIFICATION_STATUS.PENDING,
        db_index=True,
    )
    verified_at = models.DateTimeField(null=True, blank=True)
    verified_by = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="verified_documents",
    )
    rejection_reason = models.TextField(blank=True, null=True)

    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [["worker_profile", "document_type", "document_number"]]
        indexes = [
            models.Index(fields=["worker_profile", "verification_status"]),
            models.Index(fields=["uploaded_at"]),
        ]

    def __str__(self):
        return f"{self.get_document_type_display()} - {self.worker_profile.worker.get_full_name()}"


class AdminProfile(models.Model):

    admin = models.OneToOneField(
        CustomUser,
        on_delete=models.CASCADE,
        related_name="admin_profile",
    )
    can_verify_workers = models.BooleanField(default=False)
    can_manage_users = models.BooleanField(default=False)
    total_verifications = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Admin Profile of {self.admin.get_full_name()}"
