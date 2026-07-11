# Build Stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["Sigecosem.WebApi.csproj", "./"]
RUN dotnet restore "Sigecosem.WebApi.csproj"
COPY . .
RUN dotnet publish "Sigecosem.WebApi.csproj" -c Release -o /app/publish

# Runtime Stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:5000
EXPOSE 5000
RUN mkdir -p /app/uploads /app/backups
ENTRYPOINT ["dotnet", "Sigecosem.WebApi.dll"]
