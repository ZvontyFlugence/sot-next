import { IEmployee } from "@/models/Company";
import User, { IUser } from "@/models/User";
import { IEmployeeInfo } from "@/util/apiHelpers";
import { validateToken } from "@/util/auth";
import { NextApiRequest, NextApiResponse } from "next";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const validation_res = await validateToken(req, res);
  if (validation_res?.error) {
    return res.status(401).json({ error: validation_res.error });
  }
  
  switch (req.method) {
    case 'POST': {
      const { employees } = JSON.parse(req.body);
      
      try {
        let employeeInfo: IEmployeeInfo[] = await Promise.all(employees.map(async (employee: IEmployee) => {
          let profile: IUser = await User.findOne({ _id: employee.user_id }).exec();
          return { ...employee, name: profile.username, image: profile.image };
        }));

        return res.status(200).json({ employeeInfo: employeeInfo || [] });
      } catch (e) {
        return res.status(500).json({ error: 'Something Went Wrong' });
      }
    }
    default:
      return res.status(404).json({ error: 'Unhandled HTTP Method' });
  }
}