# syntax=docker/dockerfile:1

# --- Build stage: restore + publish against the .NET 10 SDK ---
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Restore first (cached layer) using only the project + solution files.
COPY TodoApp.slnx ./
COPY TodoApi/TodoApi.csproj TodoApi/
RUN dotnet restore TodoApi/TodoApi.csproj

# Copy the rest of the API source and publish a framework-dependent build.
COPY TodoApi/ TodoApi/
RUN dotnet publish TodoApi/TodoApi.csproj -c Release -o /app/publish --no-restore

# --- Runtime stage: ASP.NET runtime only (smaller, no SDK) ---
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

# Kestrel's appsettings binds :5001; inside the container we listen on :8080.
# ASPNETCORE_URLS overrides the appsettings Kestrel endpoint.
ENV ASPNETCORE_URLS=http://+:8080 \
    ASPNETCORE_ENVIRONMENT=Production

# SQLite db + Serilog logs are written under /app — make that a volume mount
# point so data survives container restarts.
RUN mkdir -p /app/data /app/logs
VOLUME ["/app/data", "/app/logs"]

COPY --from=build /app/publish ./

EXPOSE 8080

# Jwt:Key has no default in Production appsettings — Program.cs fails fast if it
# is missing. It must be supplied at runtime via Jwt__Key (env / secrets manager).
ENTRYPOINT ["dotnet", "TodoApi.dll"]
