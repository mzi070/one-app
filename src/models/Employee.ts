import { Schema, model, models } from "mongoose";

const EmployeeSchema = new Schema(
  {
    employeeId:       { type: String, required: true, unique: true },
    firstName:        { type: String, required: true },
    lastName:         { type: String, required: true },
    email:            { type: String, required: true, unique: true },
    phone:            { type: String, default: null },
    position:         { type: String, required: true },
    department:       { type: String, default: null },
    salary:           { type: Number, default: 0 },
    hireDate:         { type: Date,   default: Date.now },
    status:           { type: String, default: "active" },
    address:          { type: String, default: null },
    emergencyContact: { type: String, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret: Record<string, unknown>) => {
        ret.id = (ret._id as { toString(): string }).toString();
        // Wrap department string so API response matches Prisma shape: { department: { name } }
        ret.department = ret.department ? { name: ret.department } : null;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const Employee = models.Employee || model("Employee", EmployeeSchema);
