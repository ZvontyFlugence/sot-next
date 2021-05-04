import { IEmployee } from "@/models/Company";
import { IEmployeeInfo } from "@/util/apiHelpers";
import { request } from "@/util/ui";
import { Avatar } from "@chakra-ui/avatar";
import { Button } from "@chakra-ui/button";
import { Table, Tbody, Td, Th, Thead, Tr } from "@chakra-ui/table";
import { useToast } from "@chakra-ui/toast";
import { useRouter } from "next/router";
import { parseCookies } from "nookies";
import { useQuery } from "react-query";

interface IManageEmployees {
  company_id: number,
  employees: IEmployee[],
  currency: string,
}

const ManageEmployees: React.FC<IManageEmployees> = ({ employees, ...props }) => {
  const cookies = parseCookies();
  const router = useRouter();
  const toast = useToast();

  // Get Employee Info Query
  const { isLoading, isSuccess, data } = useQuery('getEmployeeInfo', () => {
    let payload = { employees };
    return request({
      url: '/api/companies/employeeInfo',
      method: 'POST',
      payload,
      token: cookies.token,
    });
  });

  return (
    <div className='flex'>
      {employees.length === 0 ? (
        <p>Company doesn't have any employees</p>
      ) : (
        <Table>
          <Thead>
            <Tr>
              <Th color='white'>Employee</Th>
              <Th color='white'>Title</Th>
              <Th color='white'>Wage</Th>
              <Th color='white'>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {isSuccess && data.employeeInfo && data.employeeInfo.map((employee: IEmployeeInfo, i: number) => (
              <Tr key={i}>
                <Td className='flex items-center gap-2 cursor-pointer' onClick={() => router.push(`/profile/${employee.user_id}`)}>
                  <Avatar src={employee.image} name={employee.name} />
                  {employee.name}
                </Td>
                <Td>{employee.title}</Td>
                <Td>{employee.wage.toFixed(2)} {props.currency}</Td>
                <Td>
                  <div className='flex items-center gap-4'>
                  <Button variant='solid' colorScheme='blue'>Edit</Button>
                  <Button variant='solid' colorScheme='red'>Fire</Button>
                  </div>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
    </div>
  );
}

export default ManageEmployees;