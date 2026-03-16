@description('Azure region for all resources. Defaults to the current resource group location.')
param location string = resourceGroup().location

@description('Prefix used to generate the App Service and monitoring resource names.')
@minLength(3)
param appNamePrefix string = 'm2cstocks'

@description('App Service plan SKU name.')
@allowed([
  'B1'
  'B2'
  'B3'
  'S1'
  'S2'
  'S3'
  'P1v3'
])
param appServicePlanSkuName string = 'B1'

@description('Python runtime version for the Linux web app.')
param pythonRuntimeVersion string = '3.12'

@description('Optional tags applied to all resources.')
param tags object = {
  workload: 'm2c-workload'
  environment: 'prod'
}

var suffix = uniqueString(resourceGroup().id)
var webAppName = toLower('${appNamePrefix}-${suffix}')
var appServicePlanName = '${appNamePrefix}-plan'
var logAnalyticsName = toLower(take(replace('${appNamePrefix}-law-${suffix}', '_', '-'), 63))
var appInsightsName = '${appNamePrefix}-appi'
var startupCommand = 'gunicorn --bind=0.0.0.0 --timeout 600 --workers 2 --worker-class uvicorn.workers.UvicornWorker app.main:app'

module logAnalytics 'br/public:avm/res/operational-insights/workspace:0.15.0' = {
  name: 'lawDeployment'
  params: {
    name: logAnalyticsName
    location: location
    skuName: 'PerGB2018'
    dataRetention: 30
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
    tags: tags
  }
}

module appInsights 'br/public:avm/res/insights/component:0.7.1' = {
  name: 'appInsightsDeployment'
  params: {
    name: appInsightsName
    workspaceResourceId: logAnalytics.outputs.resourceId
    location: location
    applicationType: 'web'
    flowType: 'Bluefield'
    requestSource: 'rest'
    retentionInDays: 30
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
    tags: tags
  }
}

module appServicePlan 'br/public:avm/res/web/serverfarm:0.7.0' = {
  name: 'planDeployment'
  params: {
    name: appServicePlanName
    location: location
    kind: 'linux'
    reserved: true
    skuName: appServicePlanSkuName
    tags: tags
  }
}

module webApp 'br/public:avm/res/web/site:0.22.0' = {
  name: 'webAppDeployment'
  params: {
    name: webAppName
    location: location
    kind: 'app,linux'
    serverFarmResourceId: appServicePlan.outputs.resourceId
    managedIdentities: {
      systemAssigned: true
    }
    httpsOnly: true
    publicNetworkAccess: 'Enabled'
    siteConfig: {
      linuxFxVersion: 'PYTHON|${pythonRuntimeVersion}'
      appCommandLine: startupCommand
      alwaysOn: true
      healthCheckPath: '/health'
      http20Enabled: true
      ftpsState: 'Disabled'
      minTlsVersion: '1.2'
      scmMinTlsVersion: '1.2'
    }
    configs: [
      {
        name: 'appsettings'
        properties: {
          SCM_DO_BUILD_DURING_DEPLOYMENT: 'true'
          ENABLE_ORYX_BUILD: 'true'
          APPLICATIONINSIGHTS_CONNECTION_STRING: appInsights.outputs.connectionString
          APPINSIGHTS_INSTRUMENTATIONKEY: appInsights.outputs.instrumentationKey
          M2C_CACHE_TTL_SECONDS: '300'
          M2C_HISTORY_PERIOD: '1mo'
          M2C_HISTORY_INTERVAL: '1d'
        }
      }
    ]
    tags: tags
  }
}

output webAppName string = webApp.outputs.name
output webAppHostName string = webApp.outputs.defaultHostname
output appServicePlanName string = appServicePlan.outputs.name
output applicationInsightsConnectionString string = appInsights.outputs.connectionString
output logAnalyticsWorkspaceName string = logAnalytics.outputs.name
