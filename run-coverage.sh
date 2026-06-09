#!/bin/bash

# Script to run code coverage for the backend API

echo "Running tests with code coverage..."
echo ""

cd backend

# Run tests with coverage collection
dotnet test TodoApi.Tests/TodoApi.Tests.csproj \
  --collect:"XPlat Code Coverage" \
  --results-directory:"./TestResults" \
  --logger "console;verbosity=detailed"

echo ""
echo "Coverage results generated in backend/TestResults/"
echo ""

# Find the latest coverage file
COVERAGE_FILE=$(find ./TestResults -name "coverage.cobertura.xml" | head -1)

if [ -f "$COVERAGE_FILE" ]; then
  echo "Coverage file: $COVERAGE_FILE"
  echo ""
  echo "To generate HTML report, install and run reportgenerator:"
  echo "  dotnet tool install -g dotnet-reportgenerator-globaltool"
  echo "  reportgenerator -reports:\"$COVERAGE_FILE\" -targetdir:\"./CoverageReport\" -reporttypes:Html"
  echo ""

  # Parse coverage percentage from XML
  if command -v python3 &> /dev/null; then
    echo "Coverage Summary:"
    python3 << EOF
import xml.etree.ElementTree as ET
tree = ET.parse('$COVERAGE_FILE')
root = tree.getroot()
line_rate = float(root.attrib.get('line-rate', 0)) * 100
branch_rate = float(root.attrib.get('branch-rate', 0)) * 100
print(f"  Line Coverage: {line_rate:.2f}%")
print(f"  Branch Coverage: {branch_rate:.2f}%")
EOF
  fi
else
  echo "No coverage file found. Make sure tests ran successfully."
fi

echo ""
echo "Done!"
