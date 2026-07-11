from django.db.models import Q
from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Todo
from .serializers import TodoSerializer


class TodoViewSet(viewsets.ModelViewSet):
    """
    CRUD API for todos.

    Supports:
      GET    /api/todos/            list (optionally ?completed=true|false, ?search=text)
      POST   /api/todos/            create
      GET    /api/todos/{id}/       retrieve
      PUT    /api/todos/{id}/       full update
      PATCH  /api/todos/{id}/       partial update
      DELETE /api/todos/{id}/       delete
      POST   /api/todos/{id}/toggle/  toggle completed flag
    """

    serializer_class = TodoSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["title", "description"]
    ordering_fields = ["created_at", "due_date", "priority"]

    def get_queryset(self):
        queryset = Todo.objects.all()
        completed = self.request.query_params.get("completed")
        if completed is not None:
            queryset = queryset.filter(completed=completed.lower() == "true")
        return queryset

    @action(detail=True, methods=["post"])
    def toggle(self, request, pk=None):
        todo = self.get_object()
        todo.completed = not todo.completed
        todo.save(update_fields=["completed", "updated_at"])
        return Response(self.get_serializer(todo).data)
