'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const HospitalSchema = z.object({
    name: z.string(),
    address: z.string(),
    phone: z.string(),
    distance: z.string(),
});

export const findNearbyHospitals = ai.defineTool(
    {
        name: 'findNearbyHospitals',
        description: "Finds nearby hospitals based on the user's location.",
        inputSchema: z.object({
            location: z.string().describe("The user's current location as a string, e.g., 'latitude,longitude' or a place name."),
        }),
        outputSchema: z.array(HospitalSchema),
    },
    async (input) => {
        console.log(`Finding hospitals near: ${input.location}`);

        // Mock data for nearby hospitals. In a real application, you would
        // use a service like Google Maps Platform to get this information.
        return [
            {
                name: 'Community Health Center',
                address: '123 Village Main St, Ruralville',
                phone: '555-0101',
                distance: '2.5 km',
            },
            {
                name: 'District General Hospital',
                address: '456 County Road, Townburg',
                phone: '555-0102',
                distance: '15 km',
            },
            {
                name: 'Urgent Care Clinic',
                address: '789 Farm Lane, Greenfield',
                phone: '555-0103',
                distance: '8 km',
            },
        ];
    }
);
