import z from "zod";

const stepOneSchema = z.object({
    firstName: z.string().min(3, 'First name is required'),
    lastName: z.string().min(3, 'Last name is required'),
    userEmail: z.string().email('Invalid email address'),
    userMobile: z.string().min(10, 'Phone must be at least 10 characters'),
    gender: z.string().min(3, 'Gender is required'),
    profilePic: z.union([
        z.string().min('1', 'Profile picture is required'),
        z
            .instanceof(File, { message: "Profile picture is required" })
            .refine((file) => file.size > 0, 'Profile picture is required'),
    ]),
});

const stepTwoSchema = z
    .object({
        isVehicle: z.boolean(),
        vehicleType: z.string().optional(),
        make: z.string().optional(),
        model: z.string().optional(),
        year: z.string().optional(),
        color: z.string().optional(),
        seatingCapacity: z.string().optional(),
    })
    .superRefine((data, ctx) => {
        if (data.isVehicle) {
            const requiredFields = [
                'vehicleType',
                'make',
                'model',
                'color',
                'seatingCapacity',
            ];

            requiredFields.forEach((field) => {
                if (!data[field]) {
                    ctx.addIssue({
                        path: [field],
                        message: `${field} is required`,
                        code: z.ZodIssueCode.custom,
                    });
                }
            });
        }
    });

const stepThreeSchema = z.object({
    homeStreetAddress: z.string().min(3, 'Home address is required'),
    homeCity: z.string().min(3, 'City name is required'),
    homeState: z.string().min(3, 'State name is required'),
    officeTime: z.string().min(3, 'Office time is required'),
    homeLatitude: z.number().min(1, 'Home location required'),
    homeLongitude: z.number().min(1, 'Home location required'),
    officeWayTime: z.string().min(1, 'Office way time is required'),
    workplaceStreetAddress: z.string().min(3, 'Workplace address is required'),
    workplaceCity: z.string().min(3, 'City name is required'),
    workplaceState: z.string().min(3, 'State name is required'),
    workplaceLeaveTime: z.string().min(3, 'Workplace leave time is required'),
    workplaceLatitude: z.number().min(1, 'Workplace location required'),
    workplaceLongitude: z.number().min(1, 'Workplace location required'),
});

const genders = [
    { value: 'Male', label: 'Male' },
    { value: 'Female', label: 'Female' },
    { value: 'Other', label: 'Other' },
    { value: 'Prefer not to say', label: 'Prefer not to say' },
]

const vehicles = [
    { value: 'Two Wheeler', label: 'Two Wheeler' },
    { value: 'Three Wheeler', label: 'Three Wheeler' },
    { value: 'Sedan', label: 'Sedan' },
    { value: 'Hatchback', label: 'Hatchback' },
    { value: 'SUV', label: 'SUV' },
    { value: 'Coupe', label: 'Coupe' },
    { value: 'Convertible', label: 'Convertible' },
    { value: 'Truck', label: 'Truck' },
    { value: 'Van', label: 'Van' },
]

const seatingCapacity = [
    { value: '2', label: '2 passenger' },
    { value: '3', label: '3 passenger' },
    { value: '4', label: '4 passenger' },
    { value: '5', label: '5 passenger' },
    { value: '6', label: '6 passenger' },
    { value: '7', label: '7 passenger' },
]

function decodeJWT(token) {
    try {
        const base64Url = token.split('.')[1]; // Get payload part
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c =>
            '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        ).join(''));

        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error("Invalid JWT", e);
        return null;
    }
}

export { decodeJWT, stepOneSchema, stepTwoSchema, stepThreeSchema, genders, vehicles, seatingCapacity };