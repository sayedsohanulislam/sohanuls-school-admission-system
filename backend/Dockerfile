FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080
ENV ASPNETCORE_HTTP_PORTS=8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["SchoolAdmission.sln", "./"]
COPY ["SchoolAdmission.Api/SchoolAdmission.Api.csproj", "SchoolAdmission.Api/"]
COPY ["SchoolAdmission.Tests/SchoolAdmission.Tests.csproj", "SchoolAdmission.Tests/"]

RUN dotnet restore "SchoolAdmission.sln"

COPY . .
WORKDIR "/src/SchoolAdmission.Api"
RUN dotnet build "SchoolAdmission.Api.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "SchoolAdmission.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "SchoolAdmission.Api.dll"]
