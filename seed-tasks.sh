#!/bin/bash

# Seed 30 tasks to the database
API_URL="http://localhost:5000/api/tasks"

echo "Adding 30 tasks to the database..."

# Array of sample task titles
titles=(
  "Review pull requests"
  "Update documentation"
  "Fix login bug"
  "Implement user profile page"
  "Write unit tests for auth service"
  "Refactor database queries"
  "Design new landing page"
  "Set up CI/CD pipeline"
  "Optimize API performance"
  "Add email notifications"
  "Create user settings page"
  "Implement search functionality"
  "Update dependencies"
  "Fix responsive layout issues"
  "Add data validation"
  "Implement file upload feature"
  "Write API documentation"
  "Set up error monitoring"
  "Create admin dashboard"
  "Implement role-based access"
  "Add pagination to users list"
  "Optimize database indexes"
  "Implement dark mode"
  "Add export to CSV feature"
  "Write integration tests"
  "Set up staging environment"
  "Implement caching strategy"
  "Add audit logging"
  "Create onboarding flow"
  "Optimize bundle size"
)

priorities=("Low" "Medium" "High")

for i in {1..30}; do
  title="${titles[$((i-1))]}"
  priority="${priorities[$((RANDOM % 3))]}"

  # Random description (some tasks have descriptions, some don't)
  if [ $((RANDOM % 2)) -eq 0 ]; then
    description="Description for task: $title"
    json_data=$(cat <<EOF
{
  "title": "$title",
  "description": "$description",
  "priority": "$priority"
}
EOF
)
  else
    json_data=$(cat <<EOF
{
  "title": "$title",
  "priority": "$priority"
}
EOF
)
  fi

  curl -s -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -d "$json_data" > /dev/null

  echo "Added task $i: $title (Priority: $priority)"
done

echo ""
echo "✅ Successfully added 30 tasks!"
echo "You can view them at: http://localhost:5173"
