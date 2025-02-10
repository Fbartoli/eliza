import {
    type Action,
    generateText,
    type HandlerCallback,
    type IAgentRuntime,
    type Memory,
    ModelClass,
    type State,
    composeContext,
    generateObject,
} from "@elizaos/core";
import type { SafeClient, SendTransactionProps } from "@safe-global/sdk-starter-kit";

type GetSafeActionsParams = {
    getClient: () => Promise<SafeClient>;
};

type Tool = {
    name: string;
    description: string;
    call: (client: SafeClient, parameters: unknown) => Promise<unknown>;
};

// Add this near the top of the file with other type definitions
interface SendNativeCurrencyParams {
    to: string;
    value: string;
}

/**
 * Get all AgentKit actions
 */
export async function getSafeActions({
    getClient,
}: GetSafeActionsParams): Promise<Action[]> {
    const actions = tools.map((tool: Tool) => ({
        name: tool.name.toUpperCase(),
        description: tool.description,
        similes: [],
        validate: async () => true,
        handler: async (
            runtime: IAgentRuntime,
            message: Memory,
            state: State | undefined,
            _options?: Record<string, unknown>,
            callback?: HandlerCallback
        ): Promise<boolean> => {
            try {
                const client = await getClient();
                let currentState =
                    state ?? (await runtime.composeState(message));
                currentState = await runtime.updateRecentMessageState(
                    currentState
                );

                const parameterContext = composeParameterContext(
                    tool,
                    currentState
                );
                const parameters = await generateParameters(
                    runtime,
                    parameterContext,
                    tool
                );

                const result = await executeToolAction(
                    tool,
                    parameters,
                    client
                );

                const responseContext = composeResponseContext(
                    tool,
                    result,
                    currentState
                );
                const response = await generateResponse(
                    runtime,
                    responseContext
                );

                callback?.({ text: response, content: result });
                return true;
            } catch (error) {
                const errorMessage =
                    error instanceof Error ? error.message : String(error);
                callback?.({
                    text: `Error executing action ${tool.name}: ${errorMessage}`,
                    content: { error: errorMessage },
                });
                return false;
            }
        },
        examples: [],
    }));
    return actions;
}

export const tools = [
    {
        name: "SEND_NATIVE_CURRENCY",
        description: "Deploy a new Safe",
        call: async (client: SafeClient, parameters: unknown) => {
            if (typeof parameters !== "object" || parameters === null) {
                throw new Error("Parameters must be an object");
            }

            // Type guard function
            function isSendNativeCurrencyParams(params: unknown): params is SendNativeCurrencyParams {
                const p = params as Record<string, unknown>;
                return typeof p.to === 'string' && typeof p.value === 'string';
            }

            if (!isSendNativeCurrencyParams(parameters)) {
                throw new Error("Invalid parameters: 'to' and 'value' must be strings");
            }
            
            const tx: SendTransactionProps = {
                transactions: [{
                    to: parameters.to,
                    value: parameters.value,
                    data: "0x",
                }]
            }
            const safe = await client.send(tx);
            return safe;
        },
    },
];

async function executeToolAction(
    tool: Tool,
    parameters: unknown,
    client: SafeClient
): Promise<unknown> {

    if (!tool) {
        throw new Error(`Tool ${tool.name} not found`);
    }

    return await tool.call(client, parameters);
}

function composeParameterContext(tool: Tool, state: State): string {
    const contextTemplate = `{{recentMessages}}

Given the recent messages, extract the following information for the action "${tool.name}":
${tool.description}
`;
    return composeContext({ state, template: contextTemplate });
}

async function generateParameters(
    runtime: IAgentRuntime,
    context: string,
    tool: Tool
): Promise<unknown> {
    const { object } = await generateObject({
        runtime,
        context,
        modelClass: ModelClass.LARGE,
        schema: tool.schema,
    });

    return object;
}

function composeResponseContext(
    tool: Tool,
    result: unknown,
    state: State
): string {
    const responseTemplate = `
# Action Examples
{{actionExamples}}

# Knowledge
{{knowledge}}

# Task: Generate dialog and actions for the character {{agentName}}.
About {{agentName}}:
{{bio}}
{{lore}}

{{providers}}

{{attachments}}

# Capabilities
Note that {{agentName}} is capable of reading/seeing/hearing various forms of media, including images, videos, audio, plaintext and PDFs. Recent attachments have been included above under the "Attachments" section.

The action "${tool.name}" was executed successfully.
Here is the result:
${JSON.stringify(result)}

{{actions}}

Respond to the message knowing that the action was successful and these were the previous messages:
{{recentMessages}}
`;
    return composeContext({ state, template: responseTemplate });
}

async function generateResponse(
    runtime: IAgentRuntime,
    context: string
): Promise<string> {
    return generateText({
        runtime,
        context,
        modelClass: ModelClass.LARGE,
    });
}
