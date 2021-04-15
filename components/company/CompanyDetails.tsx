import { ICompany } from "@/models/Company";
import { IUser } from "@/models/User";
import { refreshData, request, showToast } from "@/util/ui";
import { Button } from "@chakra-ui/button";
import { Grid, GridItem } from "@chakra-ui/layout";
import { Table, Tbody, Td, Th, Thead, Tr } from "@chakra-ui/table";
import { useMutation } from 'react-query';
import { parseCookies } from 'nookies';
import Card from "../Card";
import { useToast } from "@chakra-ui/toast";
import { useRouter } from "next/router";

interface ICompDetails {
  company: ICompany,
  currency: string,
  user: IUser,
}

const CompanyDetails: React.FC<ICompDetails> = ({ user, company, currency }) => {
  const cookies = parseCookies();
  const router = useRouter();
  const toast = useToast();
  let canApplyForJob: boolean = user.job > 0 && user._id !== company.ceo;

  const hireMutation = useMutation(async ({ job_id }) => {
    let payload = { action: 'apply_job', data: { company_id: company.id, job_id } };

    let data = await request({
      url: '/api/me/doActions',
      method: 'POST',
      payload,
      token: cookies.token,
    });

    if (!data.success)
      throw new Error(data?.error);
    return data;
  }, {
    onMutate: ({ job_id }: { job_id: string }) => {},
    onSuccess: () => {
      showToast(toast, 'success', 'Job Application Successful');
      refreshData(router);
    },
    onError: () => {
      showToast(toast, 'error', 'Failed to Send Application');
    },
  });

  const applyForJob = (job_id: string) => {
    hireMutation.mutate({ job_id });
  }

  return (
    <div className='w-full'>
      <Grid templateColumns='repeat(2, 1fr)' gap={12}>
        <GridItem>
          <Card>
            <Card.Header className='text-xl font-semibold'>Product Offers</Card.Header>
            <Card.Content>
              {company.productOffers.length === 0 ? (
                <p>Company has no product offers</p>
              ) : (
                <></>
              )}
            </Card.Content>
          </Card>
        </GridItem>
        <GridItem>
          <Card>
            <Card.Header className='text-xl font-semibold'>Job Offers</Card.Header>
            <Card.Content>
              {company.jobOffers.length == 0 ? (
                <p>Company has no job offers</p>
              ) : (
                <Table>
                  <Thead>
                    <Tr>
                      <Th>Title</Th>
                      <Th>Positions</Th>
                      <Th>Wage</Th>
                      <Th>Action</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {company.jobOffers.length > 0 && company.jobOffers.map((offer, i) => (
                      <Tr key={i}>
                        <Td>{offer.title}</Td>
                        <Td>{offer.quantity}</Td>
                        <Td>{offer.wage.toFixed(2)} {currency}</Td>
                        <Td>
                          <Button
                            size='sm'
                            variant='solid'
                            colorScheme='green'
                            isDisabled={!canApplyForJob}
                            onClick={() => applyForJob(offer.id)}
                          >
                            Apply
                          </Button>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              )}
            </Card.Content>
          </Card>
        </GridItem>
      </Grid>
    </div>
  );
}

export default CompanyDetails;