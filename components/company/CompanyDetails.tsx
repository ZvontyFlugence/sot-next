import { ICompany } from "@/models/Company";
import { Button } from "@chakra-ui/button";
import { Grid, GridItem } from "@chakra-ui/layout";
import { Table, Tbody, Td, Th, Thead, Tr } from "@chakra-ui/table";
import Card from "../Card";

interface ICompDetails {
  company: ICompany,
  currency: string,
}

const CompanyDetails: React.FC<ICompDetails> = ({ company, currency }) => {
  return (
    <div className='w-full'>
      <Grid templateColumns='repeat(2, 1fr)' gap={12}>
        <GridItem>
          <Card>
            <Card.Header className='text-xl font-semibold'>Product Offers</Card.Header>
            <Card.Content>
              Company has no Product Offers
            </Card.Content>
          </Card>
        </GridItem>
        <GridItem>
          <Card>
            <Card.Header className='text-xl font-semibold'>Job Offers</Card.Header>
            <Card.Content>
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
                  {company.jobOffers.map((offer, i) => (
                    <Tr key={i}>
                      <Td>{offer.title}</Td>
                      <Td>{offer.quantity}</Td>
                      <Td>{offer.wage.toFixed(2)} {currency}</Td>
                      <Td>
                        <Button size='sm' variant='solid' colorScheme='green'>
                          Apply
                        </Button>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Card.Content>
          </Card>
        </GridItem>
      </Grid>
    </div>
  );
}

export default CompanyDetails;