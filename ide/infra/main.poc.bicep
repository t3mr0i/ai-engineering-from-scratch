// PoC deployment — fast path to see the IDE backend working end-to-end,
// deployable by a Contributor (no role-assignment rights).
//
// Decisions for this PoC (harden via main.bicep before real use):
//   • No VNet/NSG. Session-pool egress is OFF (sandbox runs pure Python, no
//     internet). LLM calls go Frontend → Orchestrator /llm → Bifrost.
//   • No EasyAuth. Orchestrator runs ALLOW_ANONYMOUS=1 (open endpoint).
//   • LLM key held ONLY by the orchestrator (ACA secret), never in a sandbox.
//   • ACR pull via admin credentials (passed as secure params), because a
//     Contributor can't create the AcrPull role assignment.
//   • NO Session Executor role assignment (Contributor can't). The orchestrator
//     therefore cannot start sessions yet → /run returns 403 until an Owner
//     grants 'Azure ContainerApps Session Executor' to the orchestrator's
//     identity on the pool. The /llm proxy works without it.

@description('Location.')
param location string = resourceGroup().location

@description('Short prefix for resource names.')
@minLength(5)
@maxLength(20)
param namePrefix string = 'lhindide'

@description('ACR login server holding the images.')
param acrLoginServer string

@description('ACR admin username (passed at deploy, not committed).')
param acrUsername string

@description('ACR admin password.')
@secure()
param acrPassword string

@description('Runner image tag.')
param runnerImageTag string = 'latest'

@description('Orchestrator image tag.')
param orchestratorImageTag string = 'latest'

@description('LLM gateway base URL (orchestrator proxies /llm/* here).')
param llmGatewayUrl string = 'https://bifrost.dev.lhind.ai/v1'

@description('LLM gateway bearer key. Held only by the orchestrator.')
@secure()
param llmGatewayToken string

@description('Max concurrent sandbox sessions.')
param maxConcurrentSessions int = 320

@description('Warm pool size.')
param readySessionInstances int = 5

@description('Session idle cooldown seconds.')
param sessionCooldownSeconds int = 600

resource logs 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: '${namePrefix}-logs'
  location: location
  properties: { sku: { name: 'PerGB2018' }, retentionInDays: 30 }
}

resource env 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: '${namePrefix}-env'
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logs.properties.customerId
        sharedKey: logs.listKeys().primarySharedKey
      }
    }
    // Session pools require a Workload-profiles environment, not Consumption-only.
    workloadProfiles: [
      {
        name: 'Consumption'
        workloadProfileType: 'Consumption'
      }
    ]
  }
}

resource pool 'Microsoft.App/sessionPools@2026-01-01' = {
  name: '${namePrefix}-sessions'
  location: location
  properties: {
    environmentId: env.id
    poolManagementType: 'Dynamic'
    containerType: 'CustomContainer'
    scaleConfiguration: {
      maxConcurrentSessions: maxConcurrentSessions
      readySessionInstances: readySessionInstances
    }
    dynamicPoolConfiguration: {
      lifecycleConfiguration: {
        lifecycleType: 'Timed'
        cooldownPeriodInSeconds: sessionCooldownSeconds
      }
    }
    // PoC: sandbox cannot reach the internet.
    sessionNetworkConfiguration: { status: 'EgressDisabled' }
    managedIdentitySettings: []
    customContainerTemplate: {
      ingress: { targetPort: 8000 }
      registryCredentials: {
        server: acrLoginServer
        username: acrUsername
        passwordSecretRef: 'acr-pw'
      }
      containers: [
        {
          name: 'runner'
          image: '${acrLoginServer}/lesson-runner:${runnerImageTag}'
          resources: { cpu: json('0.5'), memory: '1Gi' }
          env: [ { name: 'RUN_TIMEOUT_S', value: '120' } ]
        }
      ]
    }
    secrets: [ { name: 'acr-pw', value: acrPassword } ]
  }
}

resource orchestrator 'Microsoft.App/containerApps@2024-03-01' = {
  name: '${namePrefix}-orchestrator'
  location: location
  // System-assigned identity so an Owner can later grant the Session Executor
  // role to it on the pool (enables /run). Creating the identity needs no
  // role-assignment rights; only granting the role does.
  identity: { type: 'SystemAssigned' }
  properties: {
    managedEnvironmentId: env.id
    configuration: {
      ingress: { external: true, targetPort: 8000, transport: 'auto' }
      registries: [
        { server: acrLoginServer, username: acrUsername, passwordSecretRef: 'acr-pw' }
      ]
      secrets: [
        { name: 'acr-pw', value: acrPassword }
        { name: 'llm-token', value: llmGatewayToken }
      ]
    }
    template: {
      containers: [
        {
          name: 'orchestrator'
          image: '${acrLoginServer}/lesson-orchestrator:${orchestratorImageTag}'
          resources: { cpu: json('0.5'), memory: '1Gi' }
          env: [
            { name: 'SESSION_POOL_ENDPOINT', value: pool.properties.poolManagementEndpoint }
            { name: 'LLM_GATEWAY_URL', value: llmGatewayUrl }
            { name: 'LLM_GATEWAY_TOKEN', secretRef: 'llm-token' }
            { name: 'ALLOW_ANONYMOUS', value: '1' }
            { name: 'RATE_LIMIT_MAX', value: '60' }
            { name: 'RATE_LIMIT_WINDOW_S', value: '60' }
          ]
        }
      ]
      scale: { minReplicas: 1, maxReplicas: 3 }
    }
  }
}

output orchestratorFqdn string = orchestrator.properties.configuration.ingress.fqdn
output poolManagementEndpoint string = pool.properties.poolManagementEndpoint
output orchestratorPrincipalId string = orchestrator.identity.principalId
