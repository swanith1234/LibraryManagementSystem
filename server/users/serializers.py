from rest_framework import serializers
from users.models import User
from django.contrib.auth.hashers import make_password

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User  # Must be the actual Django model
        fields = ["id", "username", "full_name", "email", "role", "is_active", "created_at"]
        read_only_fields = ["id", "role", "created_at"]

class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["username", "email", "password"]

    def create(self, validated_data):
        user = User(
            username=validated_data["username"],
            email=validated_data["email"],
            role="member"
        )
        user.password_hash = make_password(validated_data["password"])
        user.save()
        return user
